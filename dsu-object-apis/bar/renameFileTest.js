require('../../../psknode/bundles/testsRuntime');
require("../../../psknode/bundles/pskWebServer");

const double_check = require("double-check");
const assert = double_check.assert;

const tir = require("../../../psknode/tests/util/tir.js");

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder");

    const fileData = "Lorem Ipsum is simply dummy text";

    assert.callback("RenameFileFunctionality", (callback) => {
        tir.launchVirtualMQNode(10, testFolder, (err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, bar) => {
                if (err) {
                    throw err;
                }

                bar.writeFile("/x/y/z/a.txt", fileData, (err, brickMapDigest) => {
                    if (err) {
                        throw err;
                    }
                    assert.true(err === null || typeof err === "undefined", "Failed to write file in BAR");
                    assert.true(brickMapDigest !== null && typeof brickMapDigest !== "undefined", "Bar map digest is null or undefined");

                    bar.getKeySSIAsString((err, keySSI) => {
                        if (err) {
                            throw err;
                        }

                        resolver.loadDSU(keySSI, (err, newBar) => {
                            if (err) {
                                throw err;
                            }
                            newBar.rename("/x/y/z/a.txt", "/b.txt", (err) => {
                                assert.true(err === null || typeof err === "undefined", "Failed rename file.");

                                newBar.readFile("/b.txt", (err, data) => {
                                    assert.true(err === null || typeof err === "undefined", "Failed read file from BAR.");
                                    assert.true(fileData === data.toString(), "Invalid read data");

                                    newBar.readFile('/x/y/z/a.txt', (err, data) => {
                                        assert.true(err !== null && typeof err !== "undefined", "Source file should still exists.");
                                        callback();
                                    })
                                });
                            });
                        });
                    })
                });
            })
        });
    }, 2000);
});


