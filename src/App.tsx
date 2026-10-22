import { useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { SetupFlow } from './setup/SetupFlow';
import type { Answers } from './setup/steps';
import { Languages } from './ui/Languages';
import { AccountProvider, loadSaved, useAccount } from './lib/store';
import { BRAND_COLOURS } from './lib/model';
import { applyTheme } from './lib/theme';
import { METRICS, PRODUCTS, enabledProducts, type Account } from './lib/model';
import { Shell } from './ui/Shell';
import { ErrorToastHost } from './ui/ErrorToast';
import { Home } from './ui/Home';
import { Branding } from './ui/Branding';
import { ProductPage } from './ui/ProductPage';
import { GoLive } from './ui/GoLive';
import { Geographies } from './ui/Geographies';
import { Channels } from './ui/Channels';
import { Team } from './ui/Team';
import { Page } from './ui/StepFrame';
import { Integrations } from './ui/Integrations';
import { HelpLibrary } from './ui/HelpLibrary';

/**
 * Sign-up and login first. Then Home, the account pages, and each product.
 * Progress is kept in the browser, so it survives a reload.
 */
export default function App() {
  const [saved, setSaved] = useState<{ answers: Answers; account?: Account } | null>(() => loadSaved());

  if (!saved)
    return (
      <>
        <SetupFlow
          onDone={(answers) => {
            // The main colour picked in sign-up sets the console theme
            const pick = BRAND_COLOURS.find((c) => c.value === answers.colour);
            if (pick) applyTheme(pick.theme);
            setSaved({ answers });
          }}
        />
        <ErrorToastHost />
      </>
    );

  return (
    <AccountProvider answers={saved.answers} initial={saved.account} onRestart={() => setSaved(null)}>
      <Shell>
        <Pages />
      </Shell>
      <ErrorToastHost />
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
      return <Channels />;
    case 'team':
      return <Team />;
    case 'health':
      return <Health />;
    case 'languages':
      return <Languages />;
    case 'integrations':
      return <Integrations />;
    case 'tutorials':
    case 'documents':
    case 'faq':
      return <HelpLibrary kind={page} />;
    case 'helpcenter':
      return <HelpLibrary />;
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
