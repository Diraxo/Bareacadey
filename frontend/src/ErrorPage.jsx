export default function ErrorPage() {
  // Technical details are never shown to visitors.
  return (
    <div id="error-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <h1>Something went wrong</h1>
      <p>We couldn't load this page. Please try again in a moment.</p>
      <p><a href="/">Back to home</a></p>
    </div>
  );
}
