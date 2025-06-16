// scenario-test.js
// Simulate 1,000 CRM and chatbot scenarios and generate a summary report

const { PipedriveService } = require('./lib/pipedrive');
const fs = require('fs');

async function runScenario(index, pipedrive) {
  // Simulate a random scenario: create, update, move, note, analytics, etc.
  const actions = ['createDeal', 'moveDeal', 'addNote', 'createFollowUp', 'analytics', 'suggestNextAction'];
  const action = actions[Math.floor(Math.random() * actions.length)];
  let result = { action, success: true, error: null };
  try {
    switch (action) {
      case 'createDeal':
        await pipedrive.createDeal({ title: `Test Deal ${index}`, stageId: 1 });
        break;
      case 'moveDeal':
        await pipedrive.moveDealToStage(index, 2); // Simulate moving deal
        break;
      case 'addNote':
        await pipedrive.addNote({ content: `Test note ${index}`, dealId: index });
        break;
      case 'createFollowUp':
        await pipedrive.createFollowUp({ subject: `Follow up ${index}`, dealId: index, dueDate: new Date().toISOString().slice(0,10) });
        break;
      case 'analytics':
        await pipedrive.getPipelineAnalytics();
        break;
      case 'suggestNextAction':
        pipedrive.suggestNextAction({ stage_id: Math.floor(Math.random() * 6) + 1 });
        break;
    }
  } catch (err) {
    result.success = false;
    result.error = err.message;
  }
  return result;
}

async function main() {
  const pipedrive = new PipedriveService();
  await pipedrive.syncMetadata();
  const results = [];
  for (let i = 1; i <= 1000; i++) {
    const res = await runScenario(i, pipedrive);
    results.push(res);
  }
  // Summarize
  const summary = {
    total: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    failures: results.filter(r => !r.success),
    byAction: actions => actions.reduce((acc, a) => {
      acc[a] = results.filter(r => r.action === a && r.success).length;
      return acc;
    }, {})
  };
  fs.writeFileSync('scenario-test-report.json', JSON.stringify(summary, null, 2));
  console.log('Scenario test complete. Summary:', summary);
}

main();
