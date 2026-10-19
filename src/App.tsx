import { useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { SetupFlow } from './setup/SetupFlow';
import type { Answers } from './setup/steps';
import { AccountProvider, loadSaved, useAccount } from './lib/store';
import { METRICS, PRODUCTS, enabledProducts, type Account } from './lib/model';
import { Shell } from './ui/Shell';
import { Home } from './ui/Home';
import { Branding } from './ui/Branding';
import { ProductPage } from './ui/ProductPage';
import { GoLive } from './ui/GoLive';
import { Geographies } from './ui/Geographies';
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
  const { page } = useAccount();
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
      return <Geographies />;
    case 'sender':
      return (
        <Page
          title="Notification channels"
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
    case 'health':
      return <Health />;
    case 'languages':
      return <Page title="Language" lead="Choose the languages your team and citizens can use DIGIT in. Coming soon." />;
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

/** Health for the whole account: how each live product is doing. */
function Health() {
  const { account, go } = useAccount();
  const live = enabledProducts(account).filter((p) => account.products[p].live);
  return (
    <Page title="Product health" lead="How your live products are doing.">
      {live.length ? (
        live.map((p) => {
          const st = account.products[p];
          const tracked = st.data.metrics.length ? st.data.metrics : METRICS[p].slice(0, 3);
          return (
            <section key={p} className="card" aria-labelledby={`hl-${p}`}>
              <h2 id={`hl-${p}`}>{PRODUCTS[p].name}</h2>
              <p className="pc-health">
                <span className="dot is-ok" aria-hidden="true" />
                <strong>Healthy</strong>. Everything is working.
              </p>
              <ul className="stats">
                {tracked.map((m) => (
                  <li key={m}>
                    <span>{m}</span>
                    <strong>0</strong>
                  </li>
                ))}
              </ul>
              <p className="card-lead">Just live, so the numbers start at zero.</p>
            </section>
          );
        })
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
