export function formatDate(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsedDate);
}

export function formatDateTime(date: string): { dateLabel: string; timeLabel: string } {
  const parsedDate = new Date(date);

  return {
    dateLabel: formatDate(parsedDate),
    timeLabel: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(parsedDate),
  };
}
