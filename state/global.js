import { createContext, useCallback, useEffect, useState } from "react";
import {
	getProgram,
	getUserAccountPk,
	getPostAccountPk,
	getLikeAccountPk,
} from "../utils";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import toast from "react-hot-toast";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";

export const GlobalContext = createContext({
	isConnected: null,
	wallet: null,
	hasUserAccount: null,
	posts: null,
	fetchPosts: null,
	createUser: null,
	createPost: null,
	updatePost: null,
	deletePost: null,
	likePost: null,
	dislikePost: null,
});

export const GlobalState = ({ children }) => {
	const [program, setProgram] = useState();
	const [isConnected, setIsConnected] = useState();
	const [userAccount, setUserAccount] = useState();
	const [posts, setPosts] = useState();

	const { connection } = useConnection();
	const wallet = useAnchorWallet();

	useEffect(() => {
		if (connection) {
			setProgram(getProgram(connection, wallet ?? {}));
		} else {
			setProgram(null);
		}
	}, [connection, wallet]);

	useEffect(() => {
		setIsConnected(!!wallet?.publicKey);
	}, [wallet]);

	const fetchUserAccount = useCallback(async () => {
		if (!program) return;

		try {
			const userAccountPk = await getUserAccountPk(wallet?.publicKey);
			const userAccount = await program.account.user.fetch(userAccountPk);
			setUserAccount(userAccount);
		} catch (error) {
			setUserAccount(null);
			console.log(error);
		}
	});

	useEffect(() => {
		fetchUserAccount();
	}, [isConnected]);

	const fetchPosts = useCallback(async () => {
		if (!program) return;

		const posts = await program.account.post.all();
		setPosts(posts.map((post) => post.account));
	}, [program]);

	useEffect(() => {
		if (!posts) {
			fetchPosts();
		}
	}, [posts, fetchPosts]);

	useEffect(() => {
		if (!program) return;

		const newPostEventListener = program.addEventListener(
			"NewPostEvent",
			async (postEvent) => {
				try {
					const postAccountPk = await getPostAccountPk(
						postEvent.owner,
						postEvent.id
					);
					const newPost = await program.account.post.fetch(postAccountPk);
					setPosts((posts) => [newPost, ...posts]);
				} catch (error) {
					console.log(error);
				}
			}
		);

		const updatePostEventListener = program.addEventListener(
			"UpdatePostEvent",
			async (updateEvent) => {
				try {
					const postAccountPk = await getPostAccountPk(
						updateEvent.owner,
						updateEvent.id
					);
					const updatedPost = await program.account.post.fetch(postAccountPk);
					setPosts((posts) => {
						posts.map((post) => {
							if (
								post.owner.equals(updatedPost.owner) &&
								post.id.eq(updatePost.id)
							) {
								return updatedPost;
							}
							return post;
						});
					});
				} catch (error) {
					console.log(error);
				}
			}
		);

		const deletePostEventListener = program.addEventListener(
			"DeletePostEvent",
			(deleteEvent) => {
				setPosts((posts) => {
					posts.filter(
						(post) =>
							!(
								post.owner.equals(deleteEvent.owner) &&
								post.id.eq(deleteEvent.id)
							)
					);
				});
			}
		);

		const likeDislikePostEventListener = program.addEventListener(
			"LikeDislikePostEvent",
			(likeDislikeEvent) => {
				setPosts((posts) =>
					posts.map((post) => {
						if (
							post.owner.equals(likeDislikeEvent.owner) &&
							post.id.eq(likeDislikeEvent.id)
						) {
							return { ...posts, likes: likeDislikeEvent.likes };
						}
						return post;
					})
				);
			}
		);

		return () => {
			program.removeEventListener(newPostEventListener);
			program.removeEventListener(updatePostEventListener);
			program.removeEventListener(deletePostEventListener);
			program.removeEventListener(likeDislikePostEventListener);
		};
	}, [program]);

	const createUser = useCallback(async () => {
		if (!program) return;

		try {
			const txHash = await program.methods
				.createUser()
				.accounts({
					user: await getUserAccountPk(wallet.publicKey),
					owner: wallet.publicKey,
				})
				.rpc();
			await connection.confirmTransaction(txHash);
			toast.success("created user");
			await fetchUserAccount();
		} catch (error) {
			console.log(error);
			toast.error(error.message);
		}
	});

	const createPost = useCallback(async (title, image) => {
		if (!userAccount) return;

		try {
			const postId = userAccount.lastPostId.addn(1);
			const txHash = await program.methods
				.createPost(title, image, postId)
				.accounts({
					post: await getPostAccountPk(wallet.publicKey, postId.toNumber()),
					user: await getUserAccountPk(wallet.publicKey),
					owner: wallet.publicKey,
				})
				.rpc();
			await connection.confirmTransaction(txHash);
			toast.success("post created");

			await fetchUserAccount();
		} catch (error) {
			toast.error(error.message);
			console.log(error);
		}
	});

	const updatePost = useCallback(
		async (owner, id, title) => {
			if (!userAccount) return;

			try {
				const txHash = await program.methods
					.updatePost(title)
					.accounts({
						post: await getPostAccountPk(owner, id),
						owner,
					})
					.rpc();
				toast.success("updated");
			} catch (error) {
				toast.error(error.message);
				console.log(error);
			}
		},
		[userAccount]
	);

	const deletePost = useCallback(
		async (owner, id) => {
			if (!userAccount) return;

			try {
				const txHash = await program.methods
					.deletePost()
					.accounts({
						post: await getPostAccountPk(owner, id),
						owner,
					})
					.rpc();
				toast.success("deleted post");
			} catch (error) {
				console.log(error);
				toast.error(error.message);
			}
		},
		[userAccount]
	);

	const likePost = useCallback(
		async (owner, id, liker) => {
			if (!userAccount) return;

			try {
				const txHash = await program.methods
					.likePost()
					.accounts({
						like: await getLikeAccountPk(owner, id, liker),
						post: await getPostAccountPk(owner, id),
						user: await getUserAccountPk(wallet?.publicKey),
						owner: wallet?.publicKey,
					})
					.rpc();
				toast.success("liked");
			} catch (error) {
				console.log(error);
				toast.error(error.message);
			}
		},
		[userAccount]
	);

	const dislikePost = useCallback(
		async (owner, id, disliker) => {
			if (!userAccount) return;

			try {
				const txHash = await program.methods
					.dislikePost()
					.accounts({
						like: await getLikeAccountPk(owner, id, disliker),
						post: await getPostAccountPk(owner, id),
						owner: wallet?.publicKey,
					})
					.rpc();
				toast.success("disliked");
			} catch (error) {
				console.log(error);
				toast.error(error.message);
			}
		},
		[userAccount]
	);

	return (
		<GlobalContext.Provider
			value={{
				isConnected,
				hasUserAccount: userAccount ? true : false,
				createUser,
				createPost,
				posts,
				deletePost,
				updatePost,
				wallet,
				likePost,
				dislikePost,
			}}>
			{children}
		</GlobalContext.Provider>
	);
};
