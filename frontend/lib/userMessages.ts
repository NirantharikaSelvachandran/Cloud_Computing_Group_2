/**
 * End-user-facing copy when APIs fail or have nothing useful to show.
 * Avoid product jargon (BFF, microservices, service names).
 */
export const userMessages = {
  couldNotLoadSalaries:
    "We couldn’t load results right now. Check your internet connection and try again.",
  couldNotLoadStats: "We couldn’t load statistics right now. Check your internet connection and try again.",
  statsNoMatch:
    "No statistics are available for these filters. Try a different country or job title, or check back later.",
  couldNotSubmit: "We couldn’t send your submission. Please try again in a moment.",
  couldNotVote: "We couldn’t record your vote. Please try again.",
  salaryNotAvailable: "That salary isn’t available or could not be opened.",
  signInProblem: "We couldn’t sign you in. Check your email and password, then try again.",
  signUpProblem: "We couldn’t create your account. Please try again.",
} as const;
