const math = require('mathjs')
const prompt = require("prompt-sync")({ sigint: true });
const readXlsxFile = require('read-excel-file/node')

const { createCanvas, loadImage } = require('canvas')
const canvas = createCanvas(198.425, 198.426)
const ctx = canvas.getContext('2d')


const dt = parseFloat(prompt("Enter \Delta t: "));
const k = parseFloat(prompt("Enter abs(k): "));

const sectionCount = 54;

function subTimeCalc(t){
    return sectionCount * t;
};

const fCubicCalc = (t, r) => {
    const P0 = math.complex(r[1], r[2]);
    const P1 = math.complex(r[3], r[4]);
    const P2 = math.complex(r[5], r[6]);
    const P3 = math.complex(r[7], r[8]);

    let subTime = subTimeCalc(t);
    const ret = 
        math.add(
            math.add(
                math.multiply(P0, (-1*math.pow(subTime,3) + 3*math.pow(subTime,2) - 3*subTime + 1)),
                math.multiply(P1, (3*math.pow(subTime,3) - 6*math.pow(subTime,2) + 3*subTime))
            ),
            math.add(
                math.multiply(P2, (-3*math.pow(subTime,3) + 3*math.pow(subTime,2))),
                math.multiply(P3, (math.pow(subTime,3)))
            )
        )
    return ret;
};

const CnDict = {};
for(let n = -k; n <= k; n++){
    CnDict[n] = math.complex(0, 0);
}

function plotPoint(x, y){
    const adjX = x + 99.2125;
    const adjY = -y + 99.213;
    ctx.strokeStyle = 'rgba(255,0,0,1)';
    ctx.beginPath();
    ctx.lineTo(adjX-1, adjY);
    ctx.lineTo(adjX+1, adjY);
    ctx.stroke();
}

readXlsxFile('./SVG_Coordinate_Spreadsheet.xlsx').then((rows) => {
    // `rows` is an array of rows
    // each row being an array of cells.
    rows.forEach(row => {
        if(row[0] == 'C'){            
            for(let n = -k; n <= k; n++){
                //summation
                for(let t = 0; t < 1/sectionCount/dt; t++){
                    const f = fCubicCalc(t * dt, row);
                    const add = math.multiply(dt, math.multiply(f, math.pow(math.e, math.multiply(math.complex(0, 1), -2 * n * math.pi * (t * dt + row[9])))));
                    CnDict[n] = math.add(CnDict[n], add);
                }
            }
        }
        else if(row[0] == 'V'){
            for(let n = -k; n <= k; n++){
                for(let t = 0; t < 1/sectionCount/dt; t++){
                    const f = 
                    math.add(
                        row[1], 
                        math.multiply(
                            math.complex(0, 1),
                            math.add(
                                row[2],
                                math.multiply(
                                    subTimeCalc(t * dt),
                                    math.add(
                                        row[4],
                                        -1 * row[2]
                                    )
                                )
                            )
                        )
                    );
                    const add = 
                    math.multiply(dt,
                        math.multiply(
                            f,
                            math.pow(math.e, math.multiply(math.complex(0, 1), -2 * n * math.pi * (t * dt + row[9])))
                        )
                    );
                    CnDict[n] = math.add(CnDict[n], add);
                }
            }
        }
        else if(row[0] == 'L'){
            for(let n = -k; n <= k; n++){
                for(let t = 0; t < 1/sectionCount/dt; t++){
                    const f = math.add(
                        math.add(
                            row[1],
                            math.multiply(
                                subTimeCalc(t * dt),
                                row[3] - row[1]
                            )
                        ),
                        math.multiply(
                            math.complex(0, 1),
                            math.add(
                                row[2],
                                math.multiply(
                                    subTimeCalc(t * dt),
                                    math.add(
                                        row[4],
                                        -1 * row[2]
                                    )
                                )
                            )
                        )
                    );
                    const add =
                    math.multiply(
                        dt,
                        math.multiply(
                            math.pow(math.e, math.multiply(math.complex(0, 1), -2 * n * math.pi * (t * dt + row[9]))),
                            f
                        )
                    )
                    CnDict[n] = math.add(CnDict[n], add);
                }
            }
        }
    });

    let universalTime = 0;
    function finalF(){
        while(universalTime <= 1){
            let curr = math.complex(0, 0);
            Object.entries(CnDict).forEach(pair => {
                [currN, cn] = pair;
                //for a specific time
                //calculate f(t)
                //plot
                curr = math.add(
                    curr,
                    math.multiply(
                        cn,
                        math.pow(
                            math.e,
                            math.multiply(
                                math.complex(0, 1),
                                currN * 2 * math.pi * universalTime
                            )
                        )
                    )
                )
            });
            plotPoint(curr.re, curr.im);
            universalTime += dt;
        }
    }

    finalF();
    console.log('<img src="' + canvas.toDataURL() + '" />');
})