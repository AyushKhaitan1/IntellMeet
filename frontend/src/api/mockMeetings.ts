export interface Meeting {
  _id: string;
  title: string;
  status: "scheduled" | "live" | "ended";
  roomId: string;
}

let meetings: Meeting[] = [
  { _id: "1", title: "Sprint Planning", status: "scheduled", roomId: "room-1" },
  { _id: "2", title: "Client Demo", status: "ended", roomId: "room-2" },
];

export const getMeetings = async (): Promise<Meeting[]> => {
  await new Promise((r) => setTimeout(r, 300)); // fake network delay
  return meetings;
};

export const createMeeting = async (title: string): Promise<Meeting> => {
  await new Promise((r) => setTimeout(r, 300));
  const newMeeting: Meeting = {
    _id: String(meetings.length + 1),
    title,
    status: "scheduled",
    roomId: `room-${meetings.length + 1}`,
  };
  meetings = [...meetings, newMeeting];
  return newMeeting;
};