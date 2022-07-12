import type { Joke } from '@prisma/client';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useCatch, useLoaderData, useParams } from '@remix-run/react';
import { db } from '~/utils/db.server';

type LoaderData = {
  joke: Joke | null;
};

export const loader: LoaderFunction = async ({ params }) => {
  const foundJoke: LoaderData = {
    joke: await db.joke.findUnique({ where: { id: params.jokeId } }),
  };

  if (!foundJoke.joke) {
    throw new Response('What a joke! Not found.', { status: 404 });
  }

  return json(foundJoke);
};

export default function JokeRoute() {
  const { joke } = useLoaderData<LoaderData>();

  return (
    <div>
      <h3>Here's your hilarious joke:</h3>
      <p>{joke!.content}</p>
      <Link to=".">"{joke!.name}" Permalink</Link>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  if (caught.status === 404) {
    return (
      <div className="error-container">
        Huh? What the heck is "{params.jokeId}"?
      </div>
    );
  }

  throw new Error(`Unhandled error: ${caught.status}`);
}

export function ErrorBoundary() {
  const { jokeId } = useParams();
  return (
    <div className="error-container">{`There was an error loading joke by the id ${jokeId}.`}</div>
  );
}
