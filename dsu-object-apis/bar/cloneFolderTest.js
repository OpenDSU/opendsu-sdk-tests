require('../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;
const openDSU = require("opendsu");

const tir = require("../../../psknode/tests/util/tir.js");

let cloneFolderTest = {
    start: function (callback) {
        this.callback = callback;

        double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
            tir.launchApiHubTestNode(100, folder, async err => {
                assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                this.createDSU();
            });
        });
    },

    createDSU: function () {
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");
        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, dsu) => {
            if (err) {
                throw err;
            }

            this.addFiles(dsu);
        })
    },

    addFiles: function (dsu) {
        dsu.safeBeginBatch(err => {
            if (err) {
                throw err;
            }
            dsu.writeFile("fld/file1", "some_data", (err, result) => {
                if (err) {
                    throw err;
                }
                dsu.writeFile("fld/file2", "some_other_data", (err, result) => {
                    if (err) {
                        throw err;
                    }

                    dsu.cloneFolder("fld", "fld2", async () => {
                        await dsu.commitBatchAsync();
                        this.mountDSU(dsu);
                    });
                })
            })
        })
    },

    mountDSU: function (mountedDSU) {
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");
        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), async (err, dsu) => {
            if (err) {
                throw err;
            }

            mountedDSU.getKeySSIAsString(async (err, keySSI) => {
                if (err) {
                    throw err;
                }

                await dsu.safeBeginBatchAsync();
                dsu.mount("root", keySSI, async () => {
                    this.dsu = dsu;
                    await dsu.commitBatchAsync()
                    this.loadDSU();
                });
            });
        })
    },

    loadDSU: function () {
        const resolver = openDSU.loadApi("resolver");
        this.dsu.getKeySSIAsObject((err, keySSI) => {
            resolver.loadDSU(keySSI, (err, dsu) => {
                this.runAssertions(dsu);
            });
        });
    },

    runAssertions: function (dsu) {
        dsu.listFiles('root/fld2', (err, files) => {
            if (err) {
                throw err;
            }

            dsu.listFiles('root/fld', (err, initialFiles) => {
                assert.true(files.length === initialFiles.length);
                assert.true(files.indexOf('file1') !== -1);
                assert.true(initialFiles.indexOf('file1') !== -1);
                assert.true(files.indexOf('file2') !== -1);
                assert.true(initialFiles.indexOf('file2') !== -1);

                dsu.readFile("root/fld2/file1", (err, data) => {
                    assert.true(data.toString(), "some_data");
                    this.callback();
                });
            });
        });
    }
};

assert.callback("Clone folder test", (callback) => {
    cloneFolderTest.start(callback);
}, 3000);
