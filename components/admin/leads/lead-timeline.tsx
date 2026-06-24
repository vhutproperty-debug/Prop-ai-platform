import type { LeadActivity } from "@/types/lead";

export function LeadTimeline({ activities }: { activities: LeadActivity[] }) {
  const sorted = [...activities].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (!sorted.length) {
    return (
      <p className="text-sm text-muted">No activity recorded yet.</p>
    );
  }

  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {sorted.map((activity, index) => (
        <li key={activity._id ?? index} className="relative">
          <span className="absolute -left-[1.9rem] top-1 h-3 w-3 rounded-full bg-accent" />
          <p className="text-sm font-medium">{activity.message}</p>
          <p className="mt-1 text-xs text-muted">
            {activity.actorName ? `${activity.actorName} · ` : ""}
            {new Date(activity.createdAt).toLocaleString("en-IN")}
          </p>
        </li>
      ))}
    </ol>
  );
}
