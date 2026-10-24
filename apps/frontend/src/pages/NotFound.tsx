import { Link } from 'react-router-dom';
import { useLang } from '@/lib/i18n';

export default function NotFound() {
  const { ui } = useLang();
  return (
    <section className="container grid min-h-[80vh] place-items-center pt-16 text-center">
      <div>
        <p className="font-mono text-sm text-danger">✘ expect(page).toHaveURL(…) · 404</p>
        <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{ui.notFound.title}</h1>
        <p className="mt-4 text-muted-foreground">{ui.notFound.body}</p>
        <Link to="/" className="btn-primary mt-8">
          {ui.notFound.home}
        </Link>
      </div>
    </section>
  );
}
