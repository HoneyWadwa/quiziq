// ─── components/pages/QuizPage.jsx ───────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { quizAPI } from "../../api/services.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useTimer, useDocumentTitle } from "../../hooks/index.js";
import { calculateNextDifficulty, calculateXP, TIME_LIMIT, TOPICS } from "../../data/constants.js";
import TimerRing from "../ui/TimerRing.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import { Skeleton } from "../ui/Skeleton.jsx";

const LETTERS = ["A", "B", "C", "D"];

export default function QuizPage() {
  const { topic } = useParams();
  const [params] = useSearchParams();
  const mode = params.get("mode") || "timed";
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { addToast } = useToast();

  useDocumentTitle(`Quiz · ${TOPICS.find((t) => t.id === topic)?.label || topic}`);

  // ── Quiz state ──────────────────────────────────────────────────────────────
  const [question, setQuestion] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [qIndex, setQIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [usedIds, setUsedIds] = useState([]);
  const [selected, setSelected] = useState(null);   // option index user clicked
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);   // { correct, explanation, correctOption }
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [checkLoading, setCheckLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0); // Fetch from backend
  const [countsLoading, setCountsLoading] = useState(true); // Loading state for counts

  // Accumulate attempts for final POST /quiz/submit
  const attemptsRef = useRef([]);

  const { elapsed, reset: resetTimer } = useTimer(!answered && !fetchLoading && mode === "timed");
  const timeLeft = Math.max(TIME_LIMIT - elapsed, 0);

  // ── Fetch question counts on mount ──────────────────────────────────────────
  useEffect(() => {
    const getCounts = async () => {
      try {
        const res = await quizAPI.getQuestionCounts();
        const count = res.counts[topic] || 0;
        setTotalQuestions(count);
      } catch (err) {
        console.error("Failed to fetch question counts:", err);
        setTotalQuestions(10); // Fallback to 10 if fetch fails
      } finally {
        setCountsLoading(false);
      }
    };
    getCounts();
  }, [topic]);

  // ── Fetch first question on mount ───────────────────────────────────────────
  useEffect(() => {
    if (totalQuestions > 0 && !countsLoading) {
      fetchQuestion([], []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalQuestions, countsLoading]);

  // ── Auto-submit when timer hits zero ────────────────────────────────────────
  useEffect(() => {
    if (mode === "timed" && timeLeft === 0 && !answered && question) {
      handleAnswer(null); // null = timed out
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // ── Fetch next question from adaptive API ───────────────────────────────────
  const fetchQuestion = useCallback(async (hist, used) => {
    setFetchLoading(true);
    setQuestion(null);
    try {
      const res = await quizAPI.getNextQuestion({
        topic,
        history: hist,
        usedIds: used,
      });
      setQuestion(res.question);
      setDifficulty(res.difficulty);
    } catch (err) {
      addToast("Failed to load question — " + err.message, "error");
      navigate("/quiz");
    } finally {
      setFetchLoading(false);
    }
  }, [topic, navigate, addToast]);

  // ── Handle user selecting an option ────────────────────────────────────────
  const handleAnswer = useCallback(async (optionIdx) => {
    if (answered || checkLoading) return;
    setSelected(optionIdx);
    setCheckLoading(true);

    const timeSpent = mode === "timed" ? elapsed : 0; // practice has no meaningful time

    try {
      const res = await quizAPI.checkAnswer({
        questionId: question._id,
        selectedOption: optionIdx,
      });

      const { correct, correctOption, explanation } = res;
      const xp = calculateXP(correct, timeSpent, difficulty);

      setFeedback({ correct, correctOption, explanation });
      setAnswered(true);
      if (correct) {
        setScore((s) => s + 1);
        setXpEarned((x) => x + xp);
        addToast(`+${xp} XP${xp >= 15 ? " 🔥" : ""}`, "success");
      } else {
        addToast(optionIdx === null ? "⏰ Time's up!" : "Not quite. Keep going!", "error");
      }

      // Record attempt
      const attempt = {
        questionId: question._id,
        difficulty,
        selectedOption: optionIdx,
        correct,
        timeSpent,
        xpEarned: xp,
      };
      attemptsRef.current = [...attemptsRef.current, attempt];

      // Update local history for adaptive algorithm
      setHistory((h) => [...h, { difficulty, correct, timeSpent }]);
      setUsedIds((ids) => [...ids, question._id]);
    } catch (err) {
      addToast("Error checking answer — " + err.message, "error");
    } finally {
      setCheckLoading(false);
    }
  }, [answered, checkLoading, question, elapsed, difficulty, mode, addToast]);

  // ── Advance to next question or finish ──────────────────────────────────────
  const handleNext = async () => {
    const nextIndex = qIndex + 1;

    if (nextIndex >= totalQuestions) {
      // Submit session
      setSubmitting(true);
      try {
        const res = await quizAPI.submitQuiz({
          topic,
          mode,
          attempts: attemptsRef.current,
        });
        // Sync updated user stats into context
        updateUser(res.user);

        navigate("/results", {
          state: {
            score,
            total: totalQuestions,
            xpEarned,
            topic,
            mode,
            finalDifficulty: difficulty,
            history: attemptsRef.current,
          },
        });
      } catch (err) {
        addToast("Failed to submit quiz — " + err.message, "error");
        setSubmitting(false);
      }
      return;
    }

    // Next question
    const newHistory = [...history];
    setQIndex(nextIndex);
    setSelected(null);
    setAnswered(false);
    setFeedback(null);
    resetTimer();
    fetchQuestion(newHistory, [...usedIds, question._id]);
  };

  // ── Difficulty badge class ───────────────────────────────────────────────────
  const diffIcon = difficulty === "easy" ? "🟢" : difficulty === "medium" ? "🟡" : "🔴";
  const topicMeta = TOPICS.find((t) => t.id === topic);
  const progress = totalQuestions > 0 ? ((qIndex + 1) / totalQuestions) * 100 : 0;

  // ── Show loading while fetching counts ─────────────────────────────────────
  if (countsLoading) {
    return (
      <div className="page page-narrow animate-fade">
        <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
          <div className="text-center">
            <div className="text-lg mb-8">Loading quiz...</div>
            <div className="text-sm text-dim">Fetching question data</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Handle case where no questions are available ───────────────────────────
  if (totalQuestions === 0) {
    return (
      <div className="page page-narrow animate-fade">
        <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
          <div className="text-center">
            <div className="text-lg mb-8">No questions available</div>
            <div className="text-sm text-dim mb-16">
              There are currently no questions for this topic.
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/quiz")}
            >
              Choose Another Topic
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow animate-fade">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-24">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate("/quiz")}
          disabled={submitting}
        >
          ← Exit
        </button>

        <div className="flex items-center gap-12">
          <span className={`badge badge-${difficulty}`}>
            {diffIcon} {difficulty}
          </span>
          <div className="badge badge-violet">⚡ {xpEarned} XP</div>
        </div>

        {mode === "timed" && !fetchLoading && (
          <TimerRing elapsed={elapsed} limit={TIME_LIMIT} />
        )}
        {mode === "practice" && (
          <div
            style={{
              fontFamily: "Space Grotesk,sans-serif",
              fontSize: 14, fontWeight: 600,
              color: "var(--text-3)",
            }}
          >
            {qIndex + 1}/{totalQuestions}
          </div>
        )}
      </div>

      {/* ── Progress ── */}
      <div className="mb-32">
        <div className="flex justify-between mb-8">
          <span className="text-dim text-sm">Question {qIndex + 1} of {totalQuestions}</span>
          <span style={{ fontSize: 13, color: "var(--mint)", fontWeight: 500 }}>
            {score} correct
          </span>
        </div>
        <ProgressBar value={progress} />
      </div>

      {/* ── Question card ── */}
      {fetchLoading ? (
        <div className="card card-glow mb-24" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Skeleton width="30%" height={20} />
          <Skeleton height={28} />
          <Skeleton width="85%" height={28} />
        </div>
      ) : (
        <div className="card card-glow mb-24 animate-fade">
          <div className="mb-16">
            <span className="badge badge-cyan">
              {topicMeta?.icon} {topicMeta?.label}
            </span>
          </div>
          <h2
            style={{
              fontFamily: "Space Grotesk,sans-serif",
              fontSize: 20, fontWeight: 600, lineHeight: 1.4,
            }}
          >
            {question?.question}
          </h2>
        </div>
      )}

      {/* ── Options ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {fetchLoading
          ? [...Array(4)].map((_, i) => (
            <Skeleton key={i} height={58} borderRadius="var(--radius-lg)" />
          ))
          : question?.options.map((opt, i) => {
            let cls = "";
            if (answered && feedback) {
              if (i === feedback.correctOption) cls = "correct";
              else if (i === selected) cls = "incorrect";
            } else if (i === selected) {
              cls = "selected";
            }
            return (
              <button
                key={i}
                className={`option-card ${cls} ${answered || checkLoading ? "disabled" : ""}`}
                onClick={() => !answered && !checkLoading && handleAnswer(i)}
              >
                <div className="option-letter">{LETTERS[i]}</div>
                <span style={{ flex: 1 }}>{opt}</span>
                {answered && i === feedback?.correctOption && <span style={{ fontSize: 18 }}>✓</span>}
                {answered && i === selected && i !== feedback?.correctOption && (
                  <span style={{ fontSize: 18 }}>✗</span>
                )}
              </button>
            );
          })}
      </div>

      {/* ── Explanation ── */}
      {answered && feedback && (
        <div className="explanation-box mb-24">
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
            {feedback.correct
              ? "✅ Correct!"
              : selected === null
                ? "⏰ Time's up!"
                : "❌ Incorrect"}{" "}
            — Here's why:
          </div>
          {feedback.explanation}
        </div>
      )}

      {/* ── Action button ── */}
      {answered ? (
        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={handleNext}
          disabled={submitting}
        >
          {submitting
            ? "Saving results..."
            : qIndex + 1 >= totalQuestions
              ? "View Results 🎉"
              : "Next Question →"}
        </button>
      ) : (
        <button className="btn btn-ghost btn-full" disabled style={{ opacity: 0.4 }}>
          {fetchLoading ? "Loading question..." : "Select an answer to continue"}
        </button>
      )}
    </div>
  );
}
