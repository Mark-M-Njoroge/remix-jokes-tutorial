import type { MetaFunction } from '@remix-run/node';
import type { ReactNode } from 'react';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  //Scripts,
  ScrollRestoration,
} from '@remix-run/react';

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: "Remix: So great, it's funny!",
  viewport: 'width=device-width,initial-scale=1',
});

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        {/* <Scripts /> */}
        <LiveReload />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Document>
      <Outlet />
    </Document>
  );
}
