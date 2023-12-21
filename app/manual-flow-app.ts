import path from 'path';
import helmet from 'helmet';
import { Store } from 'express-session';
import express, { NextFunction, Request, Response } from 'express';
import { configure, JourneyContext, Plan, waypointUrl } from "@dwp/govuk-casa";
import manualAddressFields from './definitions/fields/manual-address-fields';
import confirmAddressFields from './definitions/fields/confirm-address-fields';
import { ManualAddressType } from './types/manual-address';

const manualFlowApp = (
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

  plan.addSequence('manual-address', 'confirm-address', waypointUrl({ waypoint: 'start' }));

  plan.setRoute('manual-address', 'confirm-address', (r,c) => {
    const data = c.getDataForPage('manual-address') as ManualAddressType;
    const confirmAddress = `${data.addressLine1}<br>${data.town}<br>${data.postcode}`;
    console.log(confirmAddress);
    c.setDataForPage('confirm-address', { address: confirmAddress });
    return true;
  });

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
        waypoint: 'manual-address',
        view: 'pages/manual-address.njk',
        fields: manualAddressFields,
      }, 
      {
        waypoint: 'confirm-address',
        view: 'pages/confirm-address.njk',
        fields: confirmAddressFields,
      }
    ],
    plan
  });

  ancillaryRouter.use('/start', (req: Request, res: Response) => {
    res.render('pages/start.njk');
  });

  return mount(casaApp, {});
}

export default manualFlowApp;
