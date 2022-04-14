import BaseActions from "@actions/base-actions";
import { utils as ethersUtils, constants, BigNumber } from "ethers";
import { utils } from "web3";
import config from "@utils/config";
import { convertToWei } from "@helpers/price.helpers";
import {
  getEnabledNetworkByChainId,
  getMarketplaceContractAddressByChainId,
  getMonaContractAddressByChainId,
  getSecondaryMarketplaceAddressByChainId,
} from "@services/network.service";

import auctionReducer from "../reducers/auction.reducer";
import {
  getContract,
  getMarketplaceContract,
  getMonaTokenContract,
  getERC721Contract,
  getSecondaryMarketplaceContract,
  getCryptoPaymentTokenContract,
} from "../services/contract.service";
import { toContractAddress, toItemId, toOrderId } from "@rarible/types";
import { getCurrency, getTokenAddress } from "@utils/rarible";
import { tokens } from "@utils/paymentTokens";

class BidActions extends BaseActions {
  bid(id, value, monaPerEth) {
    return async (_, getState) => {
      const account = getState().user.get("account");
      const chainId = getState().global.get("chainId");
      const network = getEnabledNetworkByChainId(chainId);
      const auctionContractAddress =
        config.AUCTION_CONTRACT_ADDRESS[network.alias];
      const contract = await getContract(auctionContractAddress);
      const weiValue = convertToWei(value);

      const monaContractAddress = await getMonaContractAddressByChainId(
        chainId
      );
      const monaContract = await getMonaTokenContract(monaContractAddress);
      const allowedValue = await monaContract.methods
        .allowance(account, auctionContractAddress)
        .call({ from: account });
      const jsAllowedValue = parseFloat(ethersUtils.formatEther(allowedValue));
      if (jsAllowedValue < 10000000000) {
        const listener = monaContract.methods
          .approve(auctionContractAddress, convertToWei(20000000000))
          .send({ from: account });
        const promise = new Promise((resolve, reject) => {
          listener.on("error", (error) => reject(error));
          listener.on("confirmation", (transactionHash) =>
            resolve(transactionHash)
          );
        });
        return {
          promise,
          unsubscribe: () => {
            listener.off("error");
            listener.off("transactionHash");
          },
        };
      }
      const listener = contract.methods
        .placeBid(id, weiValue)
        .send({ from: account });
      const promise = new Promise((resolve, reject) => {
        listener.on("error", (error) => reject(error));
        listener.on("transactionHash", (transactionHash) =>
          resolve(transactionHash)
        );
      });
      return {
        promise,
        unsubscribe: () => {
          listener.off("error");
          listener.off("transactionHash");
        },
      };
    };
  }

  getAllowanceForAcution() {
    return async (_, getState) => {
      const account = getState().user.get("account");
      const chainId = getState().global.get("chainId");
      const network = getEnabledNetworkByChainId(chainId);
      const auctionContractAddress =
        config.AUCTION_CONTRACT_ADDRESS[network.alias];
      const monaContractAddress = await getMonaContractAddressByChainId(
        chainId
      );
      const monaContract = await getMonaTokenContract(monaContractAddress);
      const allowedValue = await monaContract.methods
        .allowance(account, auctionContractAddress)
        .call({ from: account });
      return allowedValue;
    };
  }

  getApprovedInToken(crypto = "mona") {
    return async (_, getState) => {
      const account = getState().user.get("account");
      const chainId = getState().global.get("chainId");
      const marketplaceContract = await getMarketplaceContractAddressByChainId(
        chainId
      );
      const paymentTokenContract = await getCryptoPaymentTokenContract(crypto);
      const allowedValue = await paymentTokenContract.methods
        .allowance(account, marketplaceContract)
        .call({ from: account });
      const jsAllowedValue = parseFloat(ethersUtils.formatEther(allowedValue));
      return jsAllowedValue > 10000000000;
    };
  }

  getSecondaryApprovedInToken(crypto = "mona") {
    return async (_, getState) => {
      const account = getState().user.get("account");
      const chainId = getState().global.get("chainId");
      const secondaryMarketplaceAddress =
        await getSecondaryMarketplaceAddressByChainId(chainId);
      const paymentTokenContract = await getCryptoPaymentTokenContract(crypto);
      const allowedValue = await paymentTokenContract.methods
        .allowance(account, secondaryMarketplaceAddress)
        .call({ from: account });
      const jsAllowedValue = parseFloat(ethersUtils.formatEther(allowedValue));
      return jsAllowedValue > 10000000000;
    };
  }

  getSecondaryNftApproved(tokenAddress, tokenId) {
    return async (_, getState) => {
      const account = getState().user.get("account");
      const chainId = getState().global.get("chainId");
      const secondaryMarketplaceAddress =
        await getSecondaryMarketplaceAddressByChainId(chainId);
      const tokenContract = await getERC721Contract(tokenAddress);

      const approved = await tokenContract.methods
        .isApproved(tokenId, secondaryMarketplaceAddress)
        .call({ from: account });

      return approved;
    };
  }

  approveSecondaryNft(tokenAddress, tokenId) {
    return async (_, getState) => {
      const account = getState().user.get("account");
      const chainId = getState().global.get("chainId");
      const secondaryMarketplaceAddress =
        await getSecondaryMarketplaceAddressByChainId(chainId);
      const tokenContract = await getERC721Contract(tokenAddress);

      const res = await tokenContract.methods
        .setApprovalForAll(secondaryMarketplaceAddress, true)
        .send({ from: account });

      return res;
    };
  }

  addSecondaryMarketplaceProduct(tokenId, price) {
    return async (_, getState) => {
      const chainId = getState().global.get("chainId");
      const address = await getMonaContractAddressByChainId(chainId);
      const tokenMultichainAddress = getTokenAddress(tokenId);
      const currency = getCurrency(address);
      const amount = 1;
      const orderRequest = {
        itemId: toItemId(tokenMultichainAddress),
      };

      try {
        const orderResponse = await window.raribleSdk.order.sell(orderRequest);
        const response = await orderResponse.submit({
          amount,
          price,
          currency,
        });

        return response;
      } catch (error) {
        throw error;
      }
    };
  }

  updateSecondaryMarketplaceOrder(orderId, price) {
    return async (_, getState) => {
      const updateOrderRequest = {
        orderId: toOrderId(orderId),
      };

      try {
        const orderResponse = await window.raribleSdk.order.sellUpdate(
          updateOrderRequest
        );
        const response = await orderResponse.submit({
          price,
        });
        return response;
      } catch (error) {
        console.log({ error });
        throw error;
      }
    };
  }

  secondaryBid(id, contract, price) {
    return async (_, getState) => {
      const chainId = getState().global.get("chainId");
      const monaContractAddress = await getMonaContractAddressByChainId(
        chainId
      );
      const currency = getCurrency(monaContractAddress);
      const tokenMultiChainAddress = `${contract}:${id}`;
      const amount = 1;
      const orderRequest = {
        itemId: toItemId(tokenMultiChainAddress),
      };
      try {
        const bidResponse = await window.raribleSdk.order.bid(orderRequest);
        const response = await bidResponse.submit({
          amount,
          price,
          currency,
        });
        return response;
      } catch (error) {
        throw error;
      }
    };
  }

  cancelSecondaryItem(orderId) {
    return async (_, getState) => {
      const cancelOrderRequest = {
        orderId: toOrderId(orderId),
      };
      const tx = await window.raribleSdk.order.cancel
        .start(cancelOrderRequest)
        .runAll();
      await tx.wait();

      return tx;
    };
  }

  secondaryAcceptBid(orderId) {
    return async (_, getState) => {
      const fillRequest = {
        orderId: toOrderId(orderId),
      };
      try {
        const fillResponse = await window.raribleSdk.order.acceptBid(
          fillRequest
        );
        const response = await fillResponse.submit({
          amount: 1,
        });
        const tx = await response.wait();
        return tx;
      } catch (e) {
        console.log({ e });
      }
    };
  }

  secondaryBuyNow(orderId) {
    return async (_, getState) => {
      const fillRequest = {
        orderId: toOrderId(orderId),
      };
      try {
        const fillResponse = await window.raribleSdk.order.fill(fillRequest);

        const response = await fillResponse.submit({
          amount: 1, // Number of NFTs to buy
        });
        return response;
      } catch (error) {
        console.log({ error });
      }
    };
  }

  buyNow(id, value, isMona, crypto) {
    return async (_, getState) => {
      const account = getState().user.get("account");
      const chainId = getState().global.get("chainId");
      const marketplaceContract = await getMarketplaceContractAddressByChainId(
        chainId
      );
      const paymentTokenContractAddress = tokens[crypto].address;
      const paymentTokenContract = await getCryptoPaymentTokenContract(crypto);
      const contract = await getMarketplaceContract(chainId);
      if (isMona && crypto !== "matic") {
        const allowedValue = await paymentTokenContract.methods
          .allowance(account, marketplaceContract)
          .call({ from: account });
        const jsAllowedValue = parseFloat(
          ethersUtils.formatEther(allowedValue)
        );
        if (jsAllowedValue < 10) {
          const listener = paymentTokenContract.methods
            .approve(marketplaceContract, convertToWei(20))
            .send({ from: account });
          const promise = new Promise((resolve, reject) => {
            listener.on("error", (error) => reject(error));
            listener.on("confirmation", (transactionHash) =>
              resolve(transactionHash)
            );
          });
          return {
            promise,
            unsubscribe: () => {
              listener.off("error");
              listener.off("transactionHash");
            },
          };
        }
      }
      const listener = contract.methods
        .buyOffer(id, paymentTokenContractAddress, 0, 0)
        .send({ from: account });
      const promise = new Promise((resolve, reject) => {
        listener.on("error", (error) => reject(error));
        listener.on("confirmation", (transactionHash) =>
          resolve(transactionHash)
        );
      });
      return {
        promise,
        unsubscribe: () => {
          listener.off("error");
          listener.off("transactionHash");
        },
      };
    };
  }

  withdraw(id) {
    return async (_, getState) => {
      const account = getState().user.get("account");
      const auctionContractAddress = getState().global.get(
        "auctionContractAddress"
      );
      const contract = await getContract(auctionContractAddress);
      const listener = contract.methods.withdrawBid(id).send({ from: account });
      const promise = new Promise((resolve, reject) => {
        listener.on("error", (error) => reject(error));
        listener.on("transactionHash", (transactionHash) =>
          resolve(transactionHash)
        );
      });

      return {
        promise,
        unsubscribe: () => {
          listener.off("error");
          listener.off("transactionHash");
        },
      };
    };
  }
}

export default new BidActions(auctionReducer);
