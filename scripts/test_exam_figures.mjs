import assert from 'node:assert/strict'
import {exam2009,exam2015,exam2022,exam2024,classicOptions,aluOptions,makeClassicExam} from '../src/learning/exam-models.js'
import {examFigures,examDiagram} from '../src/learning/exam-diagrams.js'
const end=l=>l.frames.at(-1).state
const old=exam2009();assert.equal(old.frames.length,11);assert.equal(old.frames[4].data.length,0);assert.equal(old.frames[4].state.IR,'ADD (R1),R0');assert.equal(old.frames[8].state.AC,12);assert.equal(old.frames[9].state['M[200]'],7);assert.equal(end(old)['M[200]'],12);assert.equal(end(old).PC,101)
assert.deepEqual(old.frames[6].signals,['MemR','MDRinE']);assert.deepEqual(old.frames[9].signals,['ACout','MDRin']);assert.deepEqual(old.frames[10].signals,['MDRoutE','MemW'])
const pc=exam2015('PC加2'),shl=exam2015('shl移位'),sub=exam2015('sub间接寻址');assert.equal(end(pc).PC,102);assert.equal(end(shl).R2,'8002H');assert.equal(end(shl).R1,'4001H');assert.equal(end(sub).R0,5);assert.equal(end(sub)['M[200]'],4);assert.ok(!pc.clocked&&!shl.clocked&&!sub.clocked)
const fetch=exam2022();assert.equal(fetch.frames.length,8);assert.equal(fetch.frames[5].state.MDR,'—');assert.equal(fetch.frames[6].state.MDR,'指令字');assert.equal(fetch.frames[6].state.IR,'—');assert.equal(fetch.frames[7].state.IR,'指令字');assert.equal(end(fetch).PC,100);assert.equal(fetch.frames[0].state.MAR,'—')
assert.equal(fetch.frames.filter(f=>f.signals.includes('Read')).length,1);assert.ok(!fetch.frames.some(f=>f.signals.includes('MDRin')))
const ar=end(exam2022(true));assert.equal(ar.R3,'8000H');assert.equal(ar.OF,1);assert.equal(ar.SF,1)
const add=end(exam2024()),lw=end(exam2024(aluOptions[1]));assert.equal(add.F,((0x87654321+0x98765432)>>>0).toString(16).toUpperCase()+'H');assert.deepEqual([add.OF,add.SF,add.ZF,add.CF],[1,0,0,1]);assert.equal(lw.扩展结果,'FFFFFA04H');assert.equal(lw.F,'FFFF9CD4H');assert.equal(lw.F,(((0xffffa2d0+((0xa040a103>>>20)-4096))>>>0).toString(16).toUpperCase()+'H'));assert.equal(lw.Ext,1);assert.equal(lw.ALUBsrc,1)
assert.equal(end(exam2024(aluOptions[2])).F,end(exam2024(aluOptions[3])).F);assert.equal(end(exam2024(aluOptions[2])).F,'0000000CH')
const cases=[...classicOptions.map(makeClassicExam),...aluOptions.map(exam2024)]
for(const l of cases){const fig=examFigures[l.figure],signals=new Set(fig.controls.map(c=>c[0])),nodes=new Set(fig.nodes.map(n=>n.id));assert.ok(l.source.anchor);for(const f of l.frames){for(const key of f.data)assert.ok(fig.paths[key],`${l.title}: unknown path ${key}`);for(const key of f.signals)assert.ok(signals.has(key),`${l.title}: unknown signal ${key}`);for(const key of f.hot)assert.ok(nodes.has(key),`${l.title}: unknown node ${key}`);const html=examDiagram(l,f);assert.ok(html.includes('viewBox='));assert.ok(!html.includes('undefined'));}}
console.log(`Exam figures: ${cases.length} cases passed; external/internal MDR, decode cycle, PC+2, shift/sub operands, 5-cycle wait, signed/unsigned flags and exact lw address`)
