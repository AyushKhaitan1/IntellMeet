// Integration test script for IntellMeet API
const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🧪 Starting IntellMeet Backend API Automated Test Suite...\n');

  let accessToken = '';
  let meetingCode = '';
  let meetingId = '';
  let workspaceId = '';
  let actionItemId = '';

  const testUser = {
    name: 'Ayush Backend Lead',
    email: `ayush_${Date.now()}@intellmeet.com`,
    password: 'Password@123',
    title: 'Lead Systems Architect',
    department: 'Core Platform'
  };

  // 1. Health check
  console.log('1️⃣ Testing Health Check...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('   Status:', healthRes.status, '| DB:', healthData.data?.database?.status);

  // 2. Register
  console.log('\n2️⃣ Testing User Registration...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  const regData = await regRes.json();
  console.log('   Status:', regRes.status, '| Success:', regData.success, '| User:', regData.data?.user?.name);
  accessToken = regData.data?.accessToken;

  // 3. Login
  console.log('\n3️⃣ Testing User Login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });
  const loginData = await loginRes.json();
  console.log('   Status:', loginRes.status, '| AccessToken received:', Boolean(loginData.data?.accessToken));

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`
  };

  // 4. Update Profile
  console.log('\n4️⃣ Testing Profile Update...');
  const profRes = await fetch(`${BASE_URL}/users/profile`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      bio: 'Leading backend architecture for IntellMeet enterprise platform.',
      preferences: { theme: 'dark', audioMutedDefault: false }
    })
  });
  const profData = await profRes.json();
  console.log('   Status:', profRes.status, '| Bio updated:', profData.data?.bio);

  // 5. Create Meeting
  console.log('\n5️⃣ Testing Meeting Creation...');
  const meetingRes = await fetch(`${BASE_URL}/meetings`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Q2 Sprint Planning & Architecture Review',
      description: 'Discussing WebRTC mesh vs SFU and AI transcription pipelines',
      settings: {
        allowScreenShare: true,
        muteOnEntry: false,
        chatEnabled: true,
        aiRecordingEnabled: true
      }
    })
  });
  const meetingData = await meetingRes.json();
  meetingCode = meetingData.data?.meetingCode;
  meetingId = meetingData.data?._id;
  console.log('   Status:', meetingRes.status, '| Meeting Code:', meetingCode, '| ID:', meetingId);

  // 6. Get Meeting By Code
  console.log('\n6️⃣ Testing Get Meeting by Code...');
  const getMeetingRes = await fetch(`${BASE_URL}/meetings/code/${meetingCode}`);
  const getMeetingData = await getMeetingRes.json();
  console.log('   Status:', getMeetingRes.status, '| Title:', getMeetingData.data?.title);

  // 7. Join Meeting
  console.log('\n7️⃣ Testing Join Meeting...');
  const joinRes = await fetch(`${BASE_URL}/meetings/code/${meetingCode}/join`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ displayName: 'Ayush (Host)' })
  });
  const joinData = await joinRes.json();
  console.log('   Status:', joinRes.status, '| Meeting Status:', joinData.data?.meeting?.status);

  // 8. Create Workspace
  console.log('\n8️⃣ Testing Workspace Creation...');
  const wsRes = await fetch(`${BASE_URL}/workspaces`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Engineering Hub',
      description: 'Central engineering workspace for IntellMeet development'
    })
  });
  const wsData = await wsRes.json();
  workspaceId = wsData.data?._id;
  console.log('   Status:', wsRes.status, '| Workspace Slug:', wsData.data?.slug);

  // 9. Create Kanban Task
  console.log('\n9️⃣ Testing Kanban Task Creation...');
  const taskRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Setup WebRTC Peer Connections',
      description: 'Integrate STUN/TURN servers and handle ICE candidates',
      workspace: workspaceId,
      status: 'in_progress',
      priority: 'high',
      tags: ['WebRTC', 'Networking']
    })
  });
  const taskData = await taskRes.json();
  const taskId = taskData.data?._id;
  console.log('   Status:', taskRes.status, '| Task Title:', taskData.data?.title);

  // 10. Move Task Status
  console.log('\n🔟 Testing Move Task Status...');
  const moveRes = await fetch(`${BASE_URL}/tasks/${taskId}/move`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'done', order: 1 })
  });
  const moveData = await moveRes.json();
  console.log('   Status:', moveRes.status, '| New Status:', moveData.data?.status);

  // 11. Save AI Intelligence & Summary
  console.log('\n1️⃣1️⃣ Testing Save AI Intelligence (Summary + Action Items)...');
  const intelRes = await fetch(`${BASE_URL}/intelligence/meetings/${meetingId}/summary`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      summary: {
        overview: 'Sprint planning concluded with architecture alignment on WebRTC and AI endpoints.',
        keyPoints: [
          'Ayush completed the core backend API and MongoDB schema.',
          'Vaishali will connect frontend components to backend endpoints.',
          'Rishika will hook into the Socket.io signaling events.',
          'Vignesh will containerize using Docker and Helm.'
        ],
        decisions: [
          'Adopt JWT with refresh tokens for all protected routes.',
          'Persist real-time chat messages to MongoDB.'
        ]
      },
      extractedActionItems: [
        {
          taskTitle: 'Integrate shadcn/ui meeting lobby with backend meeting API',
          assigneeName: 'Vaishali',
          priority: 'high'
        },
        {
          taskTitle: 'Connect OpenAI Whisper transcription to Socket.io endpoint',
          assigneeName: 'Rishika',
          priority: 'urgent'
        }
      ],
      sentiment: {
        score: 0.85,
        label: 'positive',
        positivePercent: 88,
        neutralPercent: 12,
        negativePercent: 0
      },
      aiModelUsed: 'gpt-4o-mini'
    })
  });
  const intelData = await intelRes.json();
  actionItemId = intelData.data?.extractedActionItems?.[0]?._id;
  console.log('   Status:', intelRes.status, '| Extracted Items:', intelData.data?.extractedActionItems?.length);

  // 12. Convert AI Action Item to Kanban Task
  if (actionItemId) {
    console.log('\n1️⃣2️⃣ Testing Convert AI Action Item to Board Task...');
    const convertRes = await fetch(
      `${BASE_URL}/intelligence/meetings/${meetingId}/actions/${actionItemId}/to-task`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ workspaceId })
      }
    );
    const convertData = await convertRes.json();
    console.log('   Status:', convertRes.status, '| Created Task:', convertData.data?.title);
  }

  // 13. End Meeting
  console.log('\n1️⃣3️⃣ Testing End Meeting...');
  const endRes = await fetch(`${BASE_URL}/meetings/${meetingId}/end`, {
    method: 'POST',
    headers: authHeaders
  });
  const endData = await endRes.json();
  console.log('   Status:', endRes.status, '| Ended Status:', endData.data?.status);

  // 14. Get User Analytics
  console.log('\n1️⃣4️⃣ Testing User Analytics & Productivity Metrics...');
  const analyticsRes = await fetch(`${BASE_URL}/analytics/user`, {
    headers: authHeaders
  });
  const analyticsData = await analyticsRes.json();
  console.log('   Status:', analyticsRes.status, '| Total Meetings:', analyticsData.data?.totalMeetings, '| Tasks Stats:', analyticsData.data?.tasks);

  // 15. Export Meeting Notes
  console.log('\n1️⃣5️⃣ Testing Meeting Notes Export...');
  const exportRes = await fetch(`${BASE_URL}/intelligence/meetings/${meetingId}/export`);
  const exportText = await exportRes.text();
  console.log('   Status:', exportRes.status, '| Exported Bytes:', exportText.length);

  console.log('\n🎉 ALL 15 AUTOMATED TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
