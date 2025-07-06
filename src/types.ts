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
  tags?: string;
};

export type GroupAdmin = {
  group_id: string;
  group_name: string;
  admin_number: string;
};

export type Config = {
  delay: {
    min: number;
    max: number;
  };
};

export type MessageLog = {
  name: string;
  chat_id: string;
  message_id: string;
  ack: number;
  timestamp: string;
  is_group: boolean;
};

export type VcfContact = {
  name: string;
  number: string;
  filename: string;
};
