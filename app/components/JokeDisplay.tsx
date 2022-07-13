import type { Joke } from '@prisma/client';
import { Form, Link } from '@remix-run/react';

interface JokeProps {
  joke: Pick<Joke, 'content' | 'name'>;
  isOwner: boolean;
  canDelete?: boolean;
}

export default function JokeDisplay({ joke, isOwner, canDelete }: JokeProps) {
  return (
    <div>
      <h3>Here's your hilarious joke:</h3>
      <p>{joke!.content}</p>
      <Link to=".">"{joke!.name}" Permalink</Link>
      {isOwner ? (
        <Form method="post" className="delete-form">
          <input type="hidden" name="_method" value="delete" />
          <button type="submit" className="button" disabled={!canDelete}>
            Delete
          </button>
        </Form>
      ) : null}
    </div>
  );
}
