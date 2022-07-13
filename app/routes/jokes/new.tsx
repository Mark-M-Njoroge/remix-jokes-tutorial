import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useCatch } from '@remix-run/react';
import invariant from 'tiny-invariant';
import { db } from '~/utils/db.server';
import { getUserId, requireUserId } from '~/utils/session.server';

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new Response('Unauthorized', { status: 401 });
  }

  return json({});
};

interface ActionData {
  formError?: string;
  fieldErrors?: {
    name: string | undefined;
    content: string | undefined;
  };
  fields?: {
    name: string;
    content: string;
  };
}

function validateJokeContentMinLen(content: string) {
  if (content.length < 10) {
    return 'That joke too short';
  }
}

function validateJokeNameMinLen(name: string) {
  if (name.length < 3) {
    return "That joke's name is too short";
  }
}

function validateJokeNameMaxLen(name: string) {
  if (name.trim().length > 20) {
    return 'Joke name should be less than 20 characters';
  }
}

function validateJokeContentMaxLen(content: string) {
  if (content.trim().length > 500) {
    return 'Joke content should be less than 500 characters';
  }
}

const badRequest = (data: ActionData) => {
  return json(data, { status: 422 });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const body = await request.formData();

  const jokeName: string | null = body.get('name') as string | null;
  const jokeContent: string | null = body.get('content') as string | null;

  /// Validation steps

  invariant(jokeName, 'Joke name is a required field. Ensure it is not empty.');
  invariant(
    jokeContent,
    'Joke content is a required field. Ensure it is not empty.'
  );

  /// Other validations
  if (typeof jokeName !== 'string' && jokeContent !== 'string') {
    return badRequest({
      formError:
        'Your joke name and content is not in the right format type. Ensure you are submitting texts.',
    });
  }

  const fieldErrorsMinLen = {
    name: validateJokeNameMinLen(jokeName),
    content: validateJokeContentMinLen(jokeContent),
  };

  const fields = { name: jokeName, content: jokeContent };

  if (Object.values(fieldErrorsMinLen).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors: fieldErrorsMinLen,
    });
  }

  const fieldErrorsMaxLen = {
    name: validateJokeNameMaxLen(jokeName),
    content: validateJokeContentMaxLen(jokeContent),
  };

  if (Object.values(fieldErrorsMaxLen).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors: fieldErrorsMaxLen,
    });
  }

  /// Save to the database the joke

  const data = {
    name: jokeName,
    content: jokeContent,
    jokesterId: userId,
  };

  const joke = await db.joke.create({
    data,
  });

  invariant(joke, 'Could not create a joke');

  return redirect(`/jokes/${joke.id}`);
};

export default function NewJokesRoute() {
  const data = useActionData<ActionData>();

  return (
    <section>
      <p>Add your own hilarious joke</p>
      <Form method="post">
        <div>
          <label>
            Name:{' '}
            <input
              type="text"
              name="name"
              defaultValue={data?.fields?.name}
              aria-invalid={Boolean(data?.fieldErrors?.name) || undefined}
              aria-errormessage={
                data?.fieldErrors?.name ? 'name-error' : undefined
              }
            />
          </label>

          {data?.fieldErrors?.name ? (
            <p className="form-validation-error" role="alert" id="name-error">
              {data.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:{' '}
            <textarea
              name="content"
              defaultValue={data?.fields?.content}
              aria-invalid={Boolean(data?.fieldErrors?.content) || undefined}
              aria-errormessage={
                data?.fieldErrors?.content ? 'content-error' : undefined
              }
            />
          </label>
          {data?.fieldErrors?.content ? (
            <p
              className="form-validation-error"
              role="alert"
              id="content-error"
            >
              {data.fieldErrors.content}
            </p>
          ) : null}
        </div>
        <div>
          {data?.formError ? (
            <p className="form-validation-error" role="alert">
              {data.formError}
            </p>
          ) : null}

          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </section>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be logged in to create a joke.</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }

  throw new Error(`Unexpected caught response with status:  ${caught.status}`);
}

export function ErrorBoundary() {
  return (
    <div className="error-container">
      Something unexpected went wrong. Sorry about that.
    </div>
  );
}
