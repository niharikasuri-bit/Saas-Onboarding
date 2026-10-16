import { useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { SetupFlow } from './setup/SetupFlow';
import type { Answers } from './setup/steps';
import { AccountProvider, loadSaved, useAccount } from './lib/store';
import { PRODUCTS, enabledProducts, geoMode, type Account } from './lib/model';
import { Shell } from './ui/Shell';
import { Home } from './ui/Home';
import { Branding } from './ui/Branding';
import { ProductPage } from './ui/ProductPage';
import { GoLive } from './ui/GoLive';
import { GeographyBody } from './ui/GeographyPage';
import { SenderBody } from './ui/Sender';
import { UsersBody } from './ui/Users';
import { Page } from './ui/StepFrame';

/**
 * Sign-up and login first. Then Home, the account pages, and each product.
 * Progress is kept in the browser, so it survives a reload.
 */
export default function App() {
  const [saved, setSaved] = useState<{ answers: Answers; account?: Account } | null>(() => loadSaved());

  if (!saved) return <SetupFlow onDone={(answers) => setSaved({ answers })} />;

  return (
    <AccountProvider answers={saved.answers} initial={saved.account} onRestart={() => setSaved(null)}>
      <Shell>
        <Pages />
      </Shell>
    </AccountProvider>
  );
}

function Pages() {
  const { page, account } = useAccount();
  switch (page) {
    case 'home':
      return <Home />;
    case 'product':
      return <ProductPage />;
    case 'golive':
      return <GoLive />;
    case 'branding':
      return <Branding />;
    case 'geographies':
      return (
        <Page title="Geographies" lead="The areas you work in. Every product uses them.">
          <div className="sm-body is-page">
            <GeographyBody create={geoMode(account) === 'create'} />
          </div>
        </Page>
      );
    case 'sender':
      return (
        <Page
          title="Sender details"
          lead="Who your messages come from. Submit early: approvals take days, and messages can be turned on once one is submitted."
        >
          <div className="sm-body is-page">
            <SenderBody />
          </div>
        </Page>
      );
    case 'team':
      return (
        <Page title="Team" lead="Everyone in your account. Assign them inside each product.">
          <div className="sm-body is-page">
            <UsersBody />
          </div>
        </Page>
      );
    case 'dashboard':
      return <Dashboard />;
    case 'integrations':
      return <Page title="Integrations" lead="Connect DIGIT to the systems you already use. Coming soon." />;
    case 'tutorials':
      return <Page title="Tutorials and Guides" lead="Step-by-step walkthroughs. Coming soon." />;
    case 'documents':
      return <Page title="Documents" lead="Reference documents and downloads. Coming soon." />;
    case 'helpcenter':
      return <Page title="Help Center" lead="Answers to common questions, and ways to contact us. Coming soon." />;
  }
}

function Dashboard() {
  const { account, go } = useAccount();
  const live = enabledProducts(account).filter((p) => account.products[p].live);
  return (
    <Page title="Dashboard" lead="How your live products are doing.">
      {live.length ? (
        <ul className="ov-list">
          {live.map((p) => (
            <li key={p}>
              <button type="button" className="ov-item" onClick={() => go('product', { product: p, section: 'health' })}>
                <span className="dot is-ok" aria-hidden="true" />
                <span className="ov-name">{PRODUCTS[p].name}</span>
                <span className="tag is-completed">Healthy</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <section className="card empty">
          <h2>No data yet</h2>
          <p>Products show here once they’re live.</p>
          <Button variation="secondary" label="Back to Home" onClick={() => go('home')} />
        </section>
      )}
    </Page>
  );
}
