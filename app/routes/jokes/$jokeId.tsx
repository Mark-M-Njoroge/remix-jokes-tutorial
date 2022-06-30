import type { Joke } from '@prisma/client';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { db } from '~/utils/db.server';

type LoaderData = {
  joke: Joke | null;
};

export const loader: LoaderFunction = async ({ params }) => {
  const foundJoke: LoaderData = {
    joke: await db.joke.findUnique({ where: { id: params.jokeId } }),
  };

  if (!foundJoke) throw new Error('Joke not found');

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
