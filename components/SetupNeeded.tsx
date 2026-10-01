/** Shown instead of the app when a Vercel deployment has no database connected yet. */
export function SetupNeeded() {
  return (
    <section className="empty-state">
      <h2>One more step: connect a database</h2>
      <p>
        This deployment has nowhere to keep its products yet. In your Vercel project open <strong>Storage</strong>, add an{" "}
        <strong>Upstash Redis</strong> database, connect it to this project, then redeploy.
      </p>
    </section>
  );
}
