import { act, type ReactTestRenderer } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { deferred, mount } from "@/test/react";
import { ExportCsvButton } from "./ExportCsvButton";

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: vi.fn() } }));
vi.mock("@capacitor/filesystem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@capacitor/filesystem")>();
  return { Directory: actual.Directory, Filesystem: { writeFile: vi.fn() } };
});
vi.mock("@capacitor/share", () => ({ Share: { share: vi.fn() } }));

const href = "/r/restaurant/reports/export?year=2026&month=9";
const filename = "reports-2026-09.csv";
const csv = '食材,価格\r\n"醤油,特製",12.50\r\n🥕,3';
const fetchMock = vi.fn<typeof fetch>();
let view: ReactTestRenderer;
const link = () => view.root.findByType("a");
const event = () => ({ preventDefault: vi.fn() });

beforeEach(async () => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  fetchMock.mockImplementation(async () => new Response(csv));
  vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: "file:///cache/report.csv" });
  vi.mocked(Share.share).mockResolvedValue({});
  view = await mount(ExportCsvButton, { href, filename, label: "Export CSV", className: "export" });
});

describe("CSV export platform branches", () => {
  it("leaves browser navigation intact without fetching, writing or sharing", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    const click = event();
    await act(async () => { await link().props.onClick(click); });
    expect(link().props.href).toBe(href);
    expect(link().props.className).toBe("export");
    expect(link().children).toEqual(["Export CSV"]);
    expect(click.preventDefault).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(Filesystem.writeFile).not.toHaveBeenCalled();
    expect(Share.share).not.toHaveBeenCalled();
  });

  it("fetches UTF-8 CSV into cache before opening the native share sheet, blocking repeated clicks", async () => {
    const response = deferred<Response>();
    const sharing = deferred<Awaited<ReturnType<typeof Share.share>>>();
    fetchMock.mockReturnValueOnce(response.promise);
    vi.mocked(Share.share).mockReturnValueOnce(sharing.promise);
    const click = event();
    let result!: Promise<void>;
    await act(async () => { result = link().props.onClick(click); });
    expect(click.preventDefault).toHaveBeenCalledOnce();
    expect(link().children).toEqual(["…"]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(href);
    expect(Filesystem.writeFile).not.toHaveBeenCalled();
    expect(Share.share).not.toHaveBeenCalled();
    const duplicate = event();
    await act(async () => { await link().props.onClick(duplicate); });
    expect(duplicate.preventDefault).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => { response.resolve(new Response(csv)); });
    expect(Filesystem.writeFile).toHaveBeenCalledExactlyOnceWith({
      path: filename, data: Buffer.from(csv, "utf8").toString("base64"), directory: Directory.Cache,
    });
    expect(Share.share).toHaveBeenCalledExactlyOnceWith({ url: "file:///cache/report.csv" });
    expect(link().children).toEqual(["…"]); // Busy until the share sheet settles.
    await act(async () => { sharing.resolve({}); await result; });
    expect(link().children).toEqual(["Export CSV"]);
  });

  for (const stage of ["fetch", "text", "write", "share"] as const) {
    it(`releases busy after ${stage} rejection and permits another export`, async () => {
      const error = new Error(`${stage} failed`);
      if (stage === "fetch") fetchMock.mockRejectedValueOnce(error);
      if (stage === "text") {
        const response = new Response(csv);
        vi.spyOn(response, "text").mockRejectedValueOnce(error);
        fetchMock.mockResolvedValueOnce(response);
      }
      if (stage === "write") vi.mocked(Filesystem.writeFile).mockRejectedValueOnce(error);
      if (stage === "share") vi.mocked(Share.share).mockRejectedValueOnce(error);
      await act(async () => { await expect(link().props.onClick(event())).rejects.toThrow(error); });
      expect(link().children).toEqual(["Export CSV"]);
      if (stage === "fetch" || stage === "text") expect(Filesystem.writeFile).not.toHaveBeenCalled();
      if (stage !== "share") expect(Share.share).not.toHaveBeenCalled();
      await act(async () => { await link().props.onClick(event()); });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(Share.share).toHaveBeenLastCalledWith({ url: "file:///cache/report.csv" });
      expect(link().children).toEqual(["Export CSV"]);
    });
  }
});
