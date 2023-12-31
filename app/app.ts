import path from 'path';
import helmet from 'helmet';
import { Store } from 'express-session';
import express, { NextFunction, Request, Response } from 'express';
import { configure, JourneyContext, Plan, waypointUrl } from "@dwp/govuk-casa";
import addressInputFields from './definitions/fields/address-input-fields';
import selectAddressFields from './definitions/fields/select-address-fields';
import { AddressInputType } from './types/address-input';
import confirmAddressFields from './definitions/fields/confirm-address-fields';

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

  plan.setRoute('empty-page', 'address-input', (r,c) => {
    const confirmAddressData = c.getDataForPage('confirm-address') as AddressInputType; 
    return !confirmAddressData?.address
  });

  plan.setRoute('empty-page', 'confirm-address', (r,c) => {
    const confirmAddressData = c.getDataForPage('confirm-address') as AddressInputType; 
    return !!confirmAddressData?.address
  });

  plan.addSequence('address-input', 'select-address');
  plan.setRoute('select-address', 'confirm-address', (r,c) => {
    const address = (c.getDataForPage('select-address') as AddressInputType).address.replace(",", "<br>");
    console.log(address);
    c.setDataForPage('confirm-address', { address });
    return true;
  });
  plan.addSequence('confirm-address', waypointUrl({ waypoint: 'start' }));

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
        fields: selectAddressFields,
        // hooks: [{
        //   hook: 'postvalidate',
        //   middleware: (req: Request, res: Response, next: NextFunction) => {
        //     const journeyContext = JourneyContext.getDefaultContext(req.session);
        //     const address = (journeyContext.getDataForPage('select-address') as AddressInputType).address.replace(",", "<br>");
        //     console.log(`set address as: ${address}`);

        //     journeyContext.setDataForPage('confirm-address', { address });
        //     next();
        //   },
        // }],
      },
      {
        waypoint: 'confirm-address',
        view: 'pages/confirm-address.njk',
        fields: confirmAddressFields,
        // hooks: [
        //   {
        //     hook: 'prerender',
        //     middleware: (req: Request, res: Response, next: NextFunction) => {
        //       const journeyContext = JourneyContext.getDefaultContext(req.session);
        //       const data = journeyContext.getDataForPage('confirm-address');
        //       console.log("confirm-address hook:");
        //       console.log(data);
        //       next();
        //     }
        //   }
        // ]
      },
      {
        waypoint: 'empty-page', 
        view: 'pages/empty-page.njk'
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
