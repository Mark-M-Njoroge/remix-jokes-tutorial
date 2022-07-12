import type { Joke } from '@prisma/client';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useCatch, useLoaderData, useParams } from '@remix-run/react';
import { db } from '~/utils/db.server';
import { requireUserId } from '~/utils/session.server';

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();

  if (form.get('_method') !== 'delete') {
    throw new Response(`The _method ${form.get('_method')} is not supported`, {
      status: 405,
    });
  }

  const userId = await requireUserId(request);

  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });

  if (!joke) {
    throw new Response("Can't delete what does not exist", {
      status: 404,
    });
  }

  if (joke.jokesterId !== userId) {
    throw new Response("Pssh, nice try. That's not your joke", {
      status: 401,
    });
  }

  await db.joke.delete({ where: { id: params.jokeId } });
  return redirect('/jokes');
};

type LoaderData = {
  joke: Joke | null;
  user?: string;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const userId = await requireUserId(request);

  const foundJoke: LoaderData = {
    joke: await db.joke.findUnique({ where: { id: params.jokeId } }),
  };

  if (!foundJoke.joke) {
    throw new Response('What a joke! Not found.', { status: 404 });
  }

  const data = {
    ...foundJoke,
    user: userId,
  };

  console.log(data);

  return json(data);
};

export default function JokeRoute() {
  const { joke, user } = useLoaderData<LoaderData>();

  return (
    <div>
      <h3>Here's your hilarious joke:</h3>
      <p>{joke!.content}</p>
      <Link to=".">"{joke!.name}" Permalink</Link>
      {user && user === joke?.jokesterId && (
        <form method="post" className="delete-form">
          <input type="hidden" name="_method" value="delete" />
          <button type="submit" className="button">
            Delete
          </button>
        </form>
      )}
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  switch (caught.status) {
    case 405: {
      return (
        <div className="error-container">
          What you're trying to do is not allowed.
        </div>
      );
    }

    case 404: {
      return (
        <div className="error-container">
          Huh? What the heck is {params.jokeId}?
        </div>
      );
    }

    case 401: {
      return (
        <div className="error-container">
          Sorry, but {params.jokeId} is not your joke.
        </div>
      );
    }

    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
}

export function ErrorBoundary() {
  const { jokeId } = useParams();
  return (
    <div className="error-container">{`There was an error loading joke by the id ${jokeId}.`}</div>
  );
}
