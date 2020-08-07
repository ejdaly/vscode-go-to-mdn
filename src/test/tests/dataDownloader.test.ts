import * as vscode from "vscode";
import { assert, expect, use } from "chai";
import * as sinon from "sinon";
import { Response } from "node-fetch";
import DataDownloader from "../../dataDownloader";
import { appConfig } from "../../appConfig";
import Item from "../../interfaces/item";
import ItemType from "../../enums/itemType";
import * as mock from "../mocks/dataDownloader.mock";
import Config from "src/config";
import { getConfigStub } from "../util/mockFactory";

const fetch = require("node-fetch");
const fetchMock = require("fetch-mock").sandbox();
const chaiAsPromised = require("chai-as-promised");

use(chaiAsPromised);

describe("DataDownloader", () => {
  let configStub: Config;
  let dataDownloader: DataDownloader;

  before(() => {
    configStub = getConfigStub();
    dataDownloader = new DataDownloader(configStub);
  });

  describe("downloadTreeData", () => {
    beforeEach(() => {
      fetch.cache = {};
      fetch.cache.default = fetch.default;
    });

    afterEach(() => {
      fetchMock.restore();
      fetch.default = fetch.cache.default;
      delete fetch.cache;
    });

    it("should return root directories items", async () => {
      const content: string = mock.downloadTreeDataRootDirectoriesContent;
      const fetchStub = fetchMock.get(
        appConfig.rootUrl,
        new Response(content, { status: 200 })
      );
      fetch.default = fetchStub;

      const actual = await dataDownloader.downloadTreeData();
      const expected: Item[] = [
        {
          name: "label",
          url:
            "https://api.github.com/repos/mdn/browser-compat-data/contents/label?ref=master",
          type: ItemType.Directory,
          breadcrumbs: ["label"],
        },
        {
          name: "category",
          url:
            "https://api.github.com/repos/mdn/browser-compat-data/contents/category?ref=master",
          type: ItemType.Directory,
          breadcrumbs: ["category"],
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it("should return element items", async () => {
      const item: Item = mock.downloadTreeDataElementsItem;
      const content: string = mock.downloadTreeDataElementsContent;
      const fetchStub = fetchMock.get(
        "https://api.github.com/repos/mdn/browser-compat-data/contents/webdriver/commands/AcceptAlert.json?ref=master",
        new Response(content, { status: 200 })
      );
      fetch.default = fetchStub;

      const actual = await dataDownloader.downloadTreeData(item);
      const expected: Item[] = [
        {
          name: "Accept Alert - reference",
          url:
            "https://developer.mozilla.org/docs/Web/WebDriver/Commands/AcceptAlert",
          type: ItemType.File,
          parent: item,
          breadcrumbs: [
            "webdriver",
            "commands",
            "Accept Alert",
            "Accept Alert",
          ],
        },
        {
          name: "wildcard",
          url: "",
          type: ItemType.File,
          parent: item,
          breadcrumbs: ["webdriver", "commands", "Accept Alert", "wildcard"],
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it("should return directories items", async () => {
      const item: Item = mock.downloadTreeDataDirectoriesItem;
      const content: string = mock.downloadTreeDataDirectoriesContent;
      const fetchStub = fetchMock.get(
        "https://api.github.com/repos/mdn/browser-compat-data/contents/api?ref=master",
        new Response(content, { status: 200 })
      );
      fetch.default = fetchStub;

      const actual = await dataDownloader.downloadTreeData(item);
      const expected: Item[] = [
        {
          name: "Abort Controller",
          url:
            "https://api.github.com/repos/mdn/browser-compat-data/contents/api/AbortController.json?ref=master",
          type: ItemType.Directory,
          parent: item,
          rootParent: item,
          breadcrumbs: ["api", "Abort Controller"],
        },
        {
          name: "Abort Payment Event",
          url:
            "https://api.github.com/repos/mdn/browser-compat-data/contents/api/AbortPaymentEvent.json?ref=master",
          type: ItemType.Directory,
          parent: item,
          rootParent: item,
          breadcrumbs: ["api", "Abort Payment Event"],
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it("should reject once api response with inappropriate status code", async () => {
      const fetchStub = fetchMock.get(
        appConfig.rootUrl,
        new Response("", { status: 204 })
      );
      fetch.default = fetchStub;

      await expect(dataDownloader.downloadTreeData()).to.be.rejectedWith(
        "No Content"
      );
    });

    it("should request Authorization header has empty value if github personal token not passed", async () => {
      sinon.stub(vscode.workspace, "getConfiguration").returns({
        get: () => undefined,
        has: () => true,
        inspect: () => undefined,
        update: () => Promise.resolve(),
      });

      const content: string = mock.downloadTreeDataRootDirectoriesContent;
      const fetchStub = fetchMock.get(
        appConfig.rootUrl,
        new Response(content, { status: 200 })
      );
      fetch.default = fetchStub;

      const fetchSpy = sinon.spy(fetch, "default");

      await dataDownloader.downloadTreeData();
      const actual = fetchSpy.calledWith(appConfig.rootUrl, {
        headers: {
          Authorization: "",
          "Content-type": "application/json",
        },
      });
      const expected = true;

      assert.equal(actual, expected);
      sinon.restore();
    });

    it("should request Authorization header has value of github personal token once passed", async () => {
      sinon.stub(vscode.workspace, "getConfiguration").returns({
        get: () => "123456789",
        has: () => true,
        inspect: () => undefined,
        update: () => Promise.resolve(),
      });

      const content: string = mock.downloadTreeDataRootDirectoriesContent;
      const fetchStub = fetchMock.get(
        appConfig.rootUrl,
        new Response(content, { status: 200 })
      );
      fetch.default = fetchStub;

      const fetchSpy = sinon.spy(fetch, "default");

      await dataDownloader.downloadTreeData();
      const actual = fetchSpy.calledWith(appConfig.rootUrl, {
        headers: {
          Authorization: "token 123456789",
          "Content-type": "application/json",
        },
      });
      const expected = true;

      assert.equal(actual, expected);
      sinon.restore();
    });
  });

  describe("downloadFlatData", () => {
    beforeEach(() => {
      fetch.cache = {};
      fetch.cache.default = fetch.default;
    });

    afterEach(() => {
      fetchMock.restore();
      fetch.default = fetch.cache.default;
      delete fetch.cache;
    });

    it("should return array with one item", async () => {
      const fetchStub = fetchMock.get(
        appConfig.allFilesUrl,
        new Response(
          '{"items":[{"id":216685,"name":"compact","url":"https://developer.mozilla.org/docs/Web/API/HTMLUListElement/compact","parent":null,"rootParent":null,"type":2,"breadcrumbs":["api","HTMLU List Element","compact"],"timestamp":"2019-11-19T00:00:00"}]}',
          { status: 200 }
        )
      );
      fetch.default = fetchStub;

      const actual = await dataDownloader
        .downloadFlatData()
        .catch((err) => console.log(err));
      const expected: Item[] = [
        {
          name: "compact",
          url:
            "https://developer.mozilla.org/docs/Web/API/HTMLUListElement/compact",
          parent: undefined,
          type: ItemType.File,
          breadcrumbs: ["api", "HTMLU List Element", "compact"],
        },
      ];

      assert.deepEqual(actual, expected);
    });

    it("should reject once api response with inappropriate status code", async () => {
      const fetchStub = fetchMock.get(
        appConfig.allFilesUrl,
        new Response("", { status: 204 })
      );
      fetch.default = fetchStub;

      await expect(dataDownloader.downloadFlatData()).to.be.rejectedWith(
        "No Content"
      );
    });

    it("should reject once api returns error", async () => {
      const fetchStub = fetchMock.get(appConfig.allFilesUrl, {
        throws: new Error("test error message"),
      });
      fetch.default = fetchStub;

      await expect(dataDownloader.downloadFlatData()).to.be.rejectedWith(
        "test error message"
      );
    });
  });
});