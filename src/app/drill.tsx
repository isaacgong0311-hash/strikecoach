import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import PayoffDiagram from '../components/PayoffDiagram';
import Button from '../components/Button';
import { Question } from '../content/questions';
import { availableQuestions, newSession, pickNextQuestion, recordSessionAnswer, DrillSessionState } from '../lib/drillEngine';
import { loadProgress, saveProgress, recordAnswer, drillsRemainingToday, ProgressState } from '../lib/progress';
import { useEntitlement } from '../lib/revenuecat';
import { SessionEntry, encodeSessionLog } from '../lib/sessionLog';
import { color, space, type, radius } from '../theme';

const SESSION_LENGTH = 5;

export default function Drill() {
  const router = useRouter();
  const { isPro, presentPaywall } = useEntitlement();
  const [pool, setPool] = useState<Question[] | null>(null);
  const [session, setSession] = useState<DrillSessionState>(newSession());
  const [question, setQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [log, setLog] = useState<SessionEntry[]>([]);
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const p = await loadProgress();
      const availablePool = availableQuestions(isPro);
      setProgress(p);
      setPool(availablePool);
      setQuestion(pickNextQuestion(availablePool, newSession()));
    })();
  }, [isPro]);

  // Feedback fades/slides in on reveal — the one moment in the drill loop
  // worth a deliberate animation (correct/incorrect resolution). Short,
  // eased-out, no bounce: matches the app's flat, considered visual system
  // rather than adding motion for its own sake.
  useEffect(() => {
    if (selected === null) return;
    feedbackAnim.setValue(0);
    Animated.timing(feedbackAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [selected, feedbackAnim]);

  if (!pool || !question || !progress) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={color.ink} />
      </View>
    );
  }

  const isAnswered = selected !== null;
  const isCorrect = isAnswered && selected === question.correctIndex;

  const onSelect = async (index: number) => {
    if (isAnswered) return;
    setSelected(index);
    const correct = index === question.correctIndex;
    const nextProgress = recordAnswer(progress, question.category, correct);
    setProgress(nextProgress);
    await saveProgress(nextProgress);
    setSession(recordSessionAnswer(session, question, correct));
    setAnsweredCount((c) => c + 1);
    if (correct) setCorrectCount((c) => c + 1);
    setLog((prev) => [
      ...prev,
      { prompt: question.prompt, answer: question.choices[question.correctIndex], correct },
    ]);
  };

  const onNext = async () => {
    const finishedSession = answeredCount >= SESSION_LENGTH;
    const remaining = drillsRemainingToday(progress, isPro);
    const outOfFreeDrills = !isPro && remaining <= 0;

    // Finishing the session wins over the paywall, and the order matters:
    // SESSION_LENGTH and DAILY_FREE_DRILLS are both 5, so a free user who
    // completes a session has ALWAYS just hit the cap. Checking the cap first
    // meant free users were paywalled straight to the dashboard and never saw
    // the summary at all. They now get their result, and the upsell lands on
    // "Drill again" — a better moment to ask anyway.
    if (finishedSession) {
      router.replace({
        pathname: '/summary',
        params: { correct: String(correctCount), total: String(answeredCount), log: encodeSessionLog(log) },
      });
      return;
    }

    // Ran out mid-session (started with fewer drills left than a full session).
    if (outOfFreeDrills) {
      const result = await presentPaywall();
      // Whether they bought or dismissed, send them back to the dashboard —
      // it will re-check entitlement/remaining drills fresh.
      void result;
      router.replace('/');
      return;
    }

    const next = pickNextQuestion(pool, session);
    setQuestion(next);
    setSelected(null);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.progressLabel}>
        {answeredCount + 1} / {SESSION_LENGTH}
      </Text>
      <Text style={type.title}>{question.prompt}</Text>
      <PayoffDiagram points={question.points} domain={question.domain} />

      <View style={styles.choices}>
        {question.choices.map((choice, index) => {
          const isSelected = selected === index;
          const isRight = index === question.correctIndex;
          let variant: 'default' | 'correct' | 'incorrect' = 'default';
          if (isAnswered && isRight) variant = 'correct';
          else if (isAnswered && isSelected && !isRight) variant = 'incorrect';

          // Screen readers can't see the color coding, so the label carries
          // correctness explicitly once the question is answered.
          const a11yLabel =
            variant === 'correct'
              ? `${choice}, correct answer`
              : variant === 'incorrect'
                ? `${choice}, your answer, incorrect`
                : choice;

          return (
            <Pressable
              key={choice}
              onPress={() => onSelect(index)}
              disabled={isAnswered}
              style={[styles.choice, variant === 'correct' && styles.choiceCorrect, variant === 'incorrect' && styles.choiceIncorrect]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: isAnswered }}
              accessibilityLabel={a11yLabel}
            >
              <Text style={[styles.choiceText, question.category === 'payoff-reading' && styles.choiceTextMono]}>
                {choice}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isAnswered && (
        <Animated.View
          style={[
            styles.feedback,
            {
              opacity: feedbackAnim,
              transform: [
                {
                  translateY: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.feedbackHeadline, { color: isCorrect ? color.profit : color.loss }]}>
            {isCorrect ? 'Correct' : 'Not quite'}
          </Text>
          <Text style={styles.explanation}>{question.explanation}</Text>
          <Button title="Next" onPress={onNext} arrow />
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: color.bg },
  container: { padding: space.lg, paddingBottom: space.xl, gap: space.md, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  progressLabel: { ...type.label, color: color.inkFaint },
  choices: { gap: space.sm },
  choice: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space.md,
  },
  choiceCorrect: { borderColor: color.profit, backgroundColor: color.profitTint },
  choiceIncorrect: { borderColor: color.loss, backgroundColor: color.lossTint },
  choiceText: { fontSize: 15, color: color.ink, fontWeight: '500' },
  choiceTextMono: { fontFamily: type.mono },
  feedback: { gap: space.sm, marginTop: space.sm },
  feedbackHeadline: { fontSize: 18, fontWeight: '700' },
  explanation: { color: color.inkMuted, fontSize: 14, lineHeight: 20 },
});
