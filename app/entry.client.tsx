// import { RemixBrowser } from "@remix-run/react";
// import { hydrate } from "react-dom";

// hydrate(<RemixBrowser />, document);
import { hydrateRoot } from 'react-dom/client';
import { RemixBrowser } from '@remix-run/react';

hydrateRoot(document, <RemixBrowser />);
