import type { Joke } from '@prisma/client';
import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  Form,
  Link,
  useCatch,
  useLoaderData,
  useParams,
} from '@remix-run/react';
import { db } from '~/utils/db.server';
import { getUserId, requireUserId } from '~/utils/session.server';

type LoaderData = {
  joke: Joke | null;
  isOwner?: boolean;
};

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: 'No joke',
      description: 'No joke found',
    };
  }

  return {
    title: `"${data.joke?.name}" joke`,
    description: `Enjoy the "${data.joke?.name}" joke and much more`,
  };
};

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

export const loader: LoaderFunction = async ({ params, request }) => {
  const userId = await getUserId(request);

  const foundJoke: LoaderData = {
    joke: await db.joke.findUnique({ where: { id: params.jokeId } }),
  };

  if (!foundJoke.joke) {
    throw new Response('What a joke! Not found.', { status: 404 });
  }

  const data = {
    ...foundJoke,
    isOwner: !!userId && !!foundJoke.joke.jokesterId,
  };

  return json(data);
};

export default function JokeRoute() {
  const { joke, isOwner } = useLoaderData<LoaderData>();

  return (
    <div>
      <h3>Here's your hilarious joke:</h3>
      <p>{joke!.content}</p>
      <Link to=".">"{joke!.name}" Permalink</Link>
      {isOwner && (
        <Form method="post" className="delete-form">
          <input type="hidden" name="_method" value="delete" />
          <button type="submit" className="button">
            Delete
          </button>
        </Form>
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
