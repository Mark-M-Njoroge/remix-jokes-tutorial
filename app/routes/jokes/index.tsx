import type { Joke } from '@prisma/client';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { db } from '~/utils/db.server';

type LoaderData = {
  randomJoke: Joke;
};
export const loader: LoaderFunction = async () => {
  const totalJokes = await db.joke.count();

  const randomRowNumber = Math.floor(Math.random() * totalJokes);

  const [randomJoke] = await db.joke.findMany({
    take: 1,
    skip: randomRowNumber,
  });

  let data: LoaderData = { randomJoke };

  return json(data);
};

export default function JokesIndexRoute() {
  const { randomJoke } = useLoaderData<LoaderData>();

  return (
    <div>
      <h3>Here's a random joke:</h3>
      <p>{randomJoke.content}</p>
      <Link to=".">"{randomJoke.name}" Permalink</Link>
    </div>
  );
}
