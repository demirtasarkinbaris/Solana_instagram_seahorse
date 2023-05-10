import "../styles/globals.css";
import { useEffect, useMemo, useState } from "react";
import { RPC_ENDPOINT } from "../utils";
import { GlobalState } from "../state/global";

//Wallet Imports

import {
	ConnectionProvider,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

function MyApp({ Component, pageProps }) {
	const [mounted, setMounted] = useState(false);

	const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

	// In order to fix SSR error with Next
	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<ConnectionProvider
			endpoint={RPC_ENDPOINT}
			config={{ commitment: "confirmed" }}>
			<WalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider>
					{mounted && (
						<GlobalState>
							<Component {...pageProps} />
						</GlobalState>
					)}
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}

export default MyApp;
