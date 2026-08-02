// Convert a hygiene score into a grade
function gradeFromScore(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";

  return "D";
}

// Check whether the end date is after the start date
function isDateAfter(start, end) {
  return Boolean(
    start &&
    end &&
    new Date(end).getTime() > new Date(start).getTime()
  );
}

module.exports = {
  gradeFromScore,
  isDateAfter
};
