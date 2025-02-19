import { SetState } from "zustand/vanilla";
import Swal from "sweetalert2";
import useTranslation from "../i18n/I18nService";
import { ipcRenderer } from "electron";
import useStore from "./state";

const { t } = useTranslation();

export interface IGameAction {
  currentGame?: string,
  setCurrentGameAction: (id: string) => void,
  clearCurrentGameAction: () => void,
  deleteGameAction: (titleId: string, dataPath: string) => void,
  deletedGame?: string,
}

const createGameSlice = (set: SetState<IGameAction>): IGameAction => ({
  currentGame: null,
  setCurrentGameAction: (currentGame: string) => set({ currentGame }),
  clearCurrentGameAction: () => set({ currentGame: null, deletedGame: null }),
  deleteGameAction: async (titleId, dataPath) => {
    const state = useStore.getState();
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: t("areYouSure"),
      text: t("deleteGameNotice"),
      confirmButtonText: t("continue"),
      cancelButtonText: t("cancel"),
      showCancelButton: true,
    });

    if (!isConfirmed) {
      return;
    }

    await ipcRenderer.invoke("delete-game", titleId, dataPath, state.currentEmu);
    return set({ deletedGame: titleId });
  }
});

export default createGameSlice;
