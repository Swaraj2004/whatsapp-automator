export type Contact = {
  group_id?: string;
  group_name?: string;
  user_id: string;
  name?: string;
  number: string;
  tags?: string;
};

export type Group = {
  name: string;
  group_id: string;
  total_members: number;
  invite_link?: string;
  admin_only?: string;
  admin_numbers?: string;
  tags?: string;
};

export type Config = {
  delay: {
    min: number;
    max: number;
  };
};

export type ContactMessageLog = {
  name: string;
  number: string;
  chat_id: string;
  message_id: string;
  ack: number;
  timestamp: string;
};
