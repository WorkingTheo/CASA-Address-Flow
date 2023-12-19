import path from 'path';
import helmet from 'helmet';
import { Store } from 'express-session';
import express, { Request, Response } from 'express';
import { configure, Plan, waypointUrl } from "@dwp/govuk-casa";
import addressInputFields from './definitions/fields/address-input-fields';
import selectAddressFields from './definitions/fields/select-address-fields';

const app = (
  name: string,
  secret: string,
  ttl: number,
  secure: boolean,
  sessionStore: Store,
) => {
  const casaApp = express();
  casaApp.use(helmet.noSniff());

  const viewDir = path.join(__dirname, './views/');
  const localesDir = path.join(__dirname, './locales/');

  const plan = new Plan();

  plan.addSequence('address-input', 'select-address', 'confirm-address', waypointUrl({ waypoint: 'sign-in' }));

  const { mount, ancillaryRouter } = configure({
    views: [viewDir],
    i18n: {
      dirs: [localesDir],
      locales: ['en'],
    },
    session: {
      name,
      secret,
      ttl,
      secure,
      store: sessionStore,
    },
    pages: [
      {
        waypoint: 'address-input',
        view: 'pages/address-input.njk',
        fields: addressInputFields,
      },
      {
        waypoint: 'select-address',
        view: 'pages/select-address.njk',
        fields: selectAddressFields
      },
      {
        waypoint: 'confirm-address',
        view: 'pages/confirm-address.njk'
      }
    ],
    plan
  });

  ancillaryRouter.use('/start', (req: Request, res: Response) => {
    res.render('pages/start.njk');
  });

  return mount(casaApp, {});
}

export default app;
