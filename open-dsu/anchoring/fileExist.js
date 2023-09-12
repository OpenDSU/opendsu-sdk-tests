require('../../../builds/output/testsRuntime');

const tir = require('../../../psknode/tests/util/tir');
const double_check = require("double-check");
const assert = double_check.assert;

const path = require("path");
const fs = require("fs");




assert.callback('Testing fs stat functionality that is used in anchoring component', (finish) => {
    double_check.createTestFolder('AnchoringFolder', async (err, anchoringFolder) => {

        function fileExist(anchorId, callback) {
            const filePath = path.join(anchoringFolder, anchorId);
            fs.stat(filePath, (err) => {
                if (err) {
                    if (err.code === "ENOENT") {
                        return callback(undefined, false);
                    }
                    return callback(err, false);
                }
                return callback(undefined, true);
            });
        }

        if(err){
            throw err;
        }

        fileExist("anchorName", (err, result)=>{
            assert.true(typeof err === "undefined", "We should not get error if file doesn't exist");
            assert.false(result, "result should be false");

            finish();
        });

    });
}, 3000);
