import {
  openBuynowModal,
  openConnectMetamaskModal,
  openPlaceBidModal,
  openSwitchNetworkModal,
  openTokenSelect,
} from "@actions/modals.actions";
import NewButton from "@components/buttons/newbutton";
import Link from "next/link";
import { getAccount } from "@selectors/user.selectors";
import LazyLoad from "react-lazyload";
import { useRouter } from "next/router";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRarityId, reviseUrl } from "@utils/helpers";
import { getChainId } from "@selectors/global.selectors";
import Button from "@components/buttons/button";
import styles from "./styles.module.scss";

const ImageCard = ({
  mainImage,
  mainImageType,
  data,
  showDesigner = false,
  showCollectionName = false,
  showRarity = false,
  showButton = true,
  showMute = false,
  showZoom = false,
  keepRatio = false,
  imgUrl = null,
  offerCount = null,
  reservePrice = null,
  price,
  disable = false,
  withLink = false,
  imgLink = null,
  isAuction = false,
  v1 = false,
  borderType = "blue",
}) => {
  const router = useRouter();
  const account = useSelector(getAccount);
  const chainId = useSelector(getChainId);
  const { asPath } = router;
  const dispatch = useDispatch();
  const [zoomMedia, setZoomMedia] = useState(false);
  const videoTagRef = useRef();
  const [hasAudio, setHasAudio] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [defaultMainImage, setDefaultMainImage] = useState(mainImage);
  const [defaultMainImageType, setDefaultMainImageType] =
    useState(mainImageType);

  function getAudio(video) {
    return (
      video.mozHasAudio ||
      Boolean(video.webkitAudioDecodedByteCount) ||
      Boolean(video.audioTracks && video.audioTracks.length)
    );
  }

  const onBuyNow = () => {
    if (!router.asPath.includes("product")) {
      console.log("router.asPath: ", router.asPath);
      router
        .push(
          `/product/${v1 ? `v1-${data?.id}` : data?.id}/${getRarityId(
            data.rarity
          )}/${isAuction ? 1 : 0}`
        )
        .then(() => window.scrollTo(0, 0));
    } else {
      if (account) {
        if (chainId === "0x89") {
          if (!isAuction) {
            dispatch(
              openTokenSelect({
                next: openBuynowModal,
                params: {
                  id: data.id,
                  priceEth: price,
                },
              })
            );
          } else {
            dispatch(
              openPlaceBidModal({
                id: data.id,
                priceEth: price,
              })
            );
          }
        } else {
          dispatch(openSwitchNetworkModal());
        }
      } else {
        dispatch(openConnectMetamaskModal());
      }
    }
  };

  const onClickZoomOut = () => {
    setZoomMedia(true);
  };

  const onClickZoomIn = () => {
    setZoomMedia(false);
  };

  useEffect(() => {
    if (!mainImage) {
      setDefaultMainImage(
        data?.garment?.animation ||
          data?.animation ||
          data?.garment?.image ||
          data?.image
      );
      if (data?.garment?.animation || data?.animation)
        setDefaultMainImageType(1);
      else if (data?.garment?.image || data?.image) setDefaultMainImageType(2);
    }
  }, [data]);

  const onClickMute = () => {
    videoTagRef.current.pause();
    setVideoMuted(!videoMuted);
    videoTagRef.current.play();
  };

  useEffect(() => {
    if (mainImageType === 1 && videoTagRef.current) {
      videoTagRef.current.load();
    }
  }, [mainImageType, mainImage]);

  const renderImage = () => {
    return (
      <div
        className={[
          styles.bodyWrapper,
          borderType === "blue" ? styles.blue : "",
          borderType === "none" ? styles.none : "",
        ].join(" ")}
      >
        {
          // Rarity
          showRarity ? (
            <div className={styles.rarity}>
              {" "}
              {data?.rarity || data?.garment?.rarity}{" "}
            </div>
          ) : null
        }
        {data ? (
          <div
            className={[
              zoomMedia ? styles.zoomWrapper : styles.mediaWrapper,
              keepRatio ? styles.keepRatio : "",
            ].join(" ")}
            onClick={() => onClickZoomIn()}
          >
            {
              // Video
              (mainImageType || defaultMainImageType) === 1 ? (
                <LazyLoad>
                  <video
                    key={data.id}
                    autoPlay
                    muted={videoMuted}
                    loop
                    className={styles.video}
                    ref={videoTagRef}
                    preload={"auto"}
                    onLoadedData={() => {
                      if (!asPath.includes("product")) return;
                      // console.log('videoTagRef: ', videoTagRef.current)
                      var video = videoTagRef.current;
                      // console.log('video: ', video)
                      if (getAudio(video)) {
                        // console.log('video has audio')
                        setHasAudio(true);
                      } else {
                        setHasAudio(false);
                        // console.log(`video doesn't have audio`)
                      }
                    }}
                  >
                    <source
                      src={reviseUrl(mainImage || defaultMainImage)}
                      type="video/mp4"
                    />
                  </video>
                </LazyLoad>
              ) : // Image
              mainImageType === 2 || defaultMainImageType === 2 ? (
                <img
                  src={reviseUrl(mainImage || defaultMainImage)}
                  className={styles.image}
                />
              ) : null
            }
            {hasAudio && zoomMedia && showMute && (
              <Button
                className={styles.muteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onClickMute();
                }}
              >
                {videoMuted ? (
                  <img src="/images/icons/audio-off.png" />
                ) : (
                  <img src="/images/icons/audio-on.png" />
                )}
              </Button>
            )}
          </div>
        ) : null}
        {showZoom && (
          <Button
            className={[
              styles.zoomButton,
              keepRatio ? styles.keepRatioButton : "",
            ].join(" ")}
            onClick={() => onClickZoomOut()}
          >
            <img src="/images/zoom_btn.png" />
          </Button>
        )}
        {hasAudio &&
          (mainImageType === 1 || defaultMainImageType === 1) &&
          showMute && (
            <Button
              className={[
                styles.muteButton,
                keepRatio ? styles.keepRatioButton : "",
              ].join(" ")}
              onClick={() => onClickMute()}
            >
              {videoMuted ? (
                <img src="/images/icons/audio-off.png" />
              ) : (
                <img src="/images/icons/audio-on.png" />
              )}
            </Button>
          )}
        {!!reservePrice && (
          <div className={styles.reservePrice}>
            <span>{reservePrice}</span>
            <p> Reserve Price </p>
          </div>
        )}
        {imgUrl ? (
          <img src={reviseUrl(imgUrl)} className={styles.image} />
        ) : null}
        {!!offerCount && (
          <div className={styles.offerCount}>
            <span>{offerCount}</span> Offers
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={styles.imageCardWrapper}>
        {showCollectionName ? (
          <Link
            href={
              imgLink
                ? imgLink
                : `/product/${data?.id}/${getRarityId(data?.rarity)}/${
                    isAuction ? 1 : 0
                  }`
            }
          >
            <a className={styles.collectionName}>
              {data?.garment ? data.garment.name : data.name}
            </a>
          </Link>
        ) : null}
        {showDesigner ? (
          <a
            href={`https://models.digitalax.xyz/models/${data?.model?.name}`}
            target="_blank"
            className={styles.designerLink}
          >
            <div className={styles.designerWrapper}>
              <img src={data?.model?.image} className={styles.photo} />
              <div className={styles.name}>{data?.model?.name} </div>
            </div>
          </a>
        ) : null}
        {withLink ? (
          <Link
            href={
              imgLink
                ? imgLink
                : `/product/${data?.id}/${getRarityId(data?.rarity)}/${
                    isAuction ? 1 : 0
                  }`
            }
          >
            <a>{renderImage()}</a>
          </Link>
        ) : (
          renderImage()
        )}

        {showButton && (
          <div className={styles.buyNow}>
            <NewButton
              text={
                disable ? "Sold Out" : isAuction ? "Place A Bid" : "Buy Now"
              }
              onClick={onBuyNow}
              disable={disable}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ImageCard;
