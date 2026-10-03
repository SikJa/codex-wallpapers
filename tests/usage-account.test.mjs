import {test} from 'node:test';
import assert from 'node:assert/strict';
import {accountSnapshot} from '../src/usage-account.mjs';
test('Account metrics use supplied summary, never recompute totals or peak from retained days',()=>{
 const snapshot=accountSnapshot({summary:{lifetimeTokens:1000,peakDailyTokens:500,longestRunningTurnSec:70,currentStreakDays:3,longestStreakDays:8},dailyUsageBuckets:[{startDate:'2026-10-02',tokens:20}],threadUsage:[{secret:'not copied'}]},new Date('2026-10-03T12:00:00Z'));
 assert.equal(snapshot.totalTokens,1000);assert.equal(snapshot.peakDailyTokens,500);assert.equal(snapshot.dailyTokens['2026-10-02'],20);assert.equal(snapshot.longestTaskSeconds,70);assert.equal(snapshot.source,'official-account-usage');assert.equal('threadUsage' in snapshot,false);
});
test('Unavailable fields remain missing, not fabricated zero; invalid buckets are rejected',()=>{
 const snapshot=accountSnapshot({summary:{},dailyUsageBuckets:[]});assert.equal(snapshot.totalTokens,null);assert.equal(snapshot.currentStreakDays,null);
 assert.throws(()=>accountSnapshot({summary:{},dailyUsageBuckets:[{startDate:'oops',tokens:1}]}));
 assert.throws(()=>accountSnapshot({summary:{},dailyUsageBuckets:[{startDate:'2026-10-02',tokens:-1}]}));
});
