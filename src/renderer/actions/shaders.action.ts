import { ipcRenderer } from "electron";
import Swal from "sweetalert2";
import useStore from "./state";
import useTranslation from "../i18n/I18nService";
import { SetState } from "zustand/vanilla";
import pirate from "../resources/pirate.gif";

export interface IShaders {
  needRefreshShaders: boolean,
  downloadShadersAction: (titleId: string, dataPath: string) => void,
  shareShaders: (titleId: string, dataPath: string, localShaderCount: number, emusakCount: number) => void,
}

const { t } = useTranslation();

const createShadersSlice = (set: SetState<IShaders>): IShaders => ({
  needRefreshShaders: false,
  downloadShadersAction: async (titleId, dataPath) => {
    const state = useStore.getState();

    state.upsertFileAction({
      filename: titleId,
      downloadSpeed: Infinity,
      progress: 0
    });

    const onShaderDownloadProgress = (_: unknown, filename: string, percentage: number, downloadSpeed: number) => {
      useStore.getState().updateFileProgress(titleId, filename, percentage, downloadSpeed);
    };

    ipcRenderer.on("download-progress", onShaderDownloadProgress);
    const result = await ipcRenderer.invoke("install-shaders", titleId, dataPath).catch(() => null);
    state.removeFileAction(titleId);
    ipcRenderer.removeListener("download-progress", onShaderDownloadProgress);

    if (!result) {
      Swal.fire({
        icon: "error",
        text: t("FETCH_FAILED")
      });
      return set({ needRefreshShaders: !state.needRefreshShaders });
    }

    Swal.fire({
      imageUrl: pirate,
      text: "Success !"
    });
    return set({ needRefreshShaders: !state.needRefreshShaders });
  },
  shareShaders: async (titleId, dataPath, localShaderCount, emusakCount) => {
    await Swal.fire({
      icon: "info",
      text: `${t("pickRyuBin")}. ${t("shadersCheck")}`,
      allowOutsideClick: false
    });
    const state = useStore.getState();
    const dlManagerFilename = t("shadersSharing");

    state.upsertFileAction({
      filename: dlManagerFilename,
      downloadSpeed: Infinity,
      progress: 0
    });

    const onShadersShareProgress = (_: any, filename: string, percentage: number) => {
      if (filename !== titleId) {
        return;
      }

      useStore.getState().upsertFileAction({
        filename: dlManagerFilename,
        downloadSpeed: Infinity,
        progress: percentage
      });
    };

    ipcRenderer.on("download-progress", onShadersShareProgress);

    const result: { error: boolean, code: string } | true = await ipcRenderer.invoke("share-shaders", titleId, dataPath, localShaderCount, emusakCount);
    state.removeFileAction(dlManagerFilename);
    ipcRenderer.removeListener("download-progress", onShadersShareProgress);

    if (result !== true) {
      return Swal.fire({
        icon: "error",
        text: result.code
      });
    }

    return Swal.fire({
      imageUrl: pirate,
      html: t("shadersShared"),
    });
  }
});

export default createShadersSlice;
