// import { useAppContext } from '../../context/context'

import { AiOutlineHeart, AiOutlineClose } from "react-icons/ai";
import { FaRegComment, FaEdit } from "react-icons/fa";
import { IoPaperPlaneOutline } from "react-icons/io5";
import { RiMoneyDollarCircleLine, RiDislikeFill } from "react-icons/ri";
import { useGlobalState } from "../../hooks";

const style = {
	wrapper: `flex`,
	icon: `m-2`,
	tipIcon: `flex align-center cursor-pointer mr-[1rem] mt-[10px]`,
};

const ActionButtons = ({ owner, postId, toggleEditPostModal }) => {
	const { likePost, wallet, dislikePost } = useGlobalState();

	return (
		<div className={style.wrapper}>
			<AiOutlineHeart
				className={style.icon}
				size={24}
				onClick={() => likePost(owner, postId, wallet?.publicKey)}
			/>
			<RiDislikeFill
				className={style.icon}
				size={24}
				onClick={() => dislikePost(owner, postId, wallet?.publicKey)}
			/>
			<FaEdit
				className={style.icon}
				size={22}
				onClick={() => toggleEditPostModal(true, postId, owner)}
			/>
			<div className="flex-1" />
		</div>
	);
};

export default ActionButtons;
