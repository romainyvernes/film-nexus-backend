import * as Message from "../../models/Message";
import { addItemIntoDb, addProject, addUser } from "../utils/helpers";
import { newTestUserInfo, projectInfo } from "../utils/testData";

describe('Message Model', () => {
  let user, project, message;

  beforeAll(async () => {
    // create new user in DB
    user = await addUser({
      username: newTestUserInfo.username,
      firstName: newTestUserInfo.firstName,
      lastName: newTestUserInfo.lastName,
    });
    // add new project in DB
    project = await addProject({
      name: projectInfo.name,
      creatorId: user.id,
    });
  });

  it('should create a new message', async () => {
    const messageFields = {
      text: "This is my first message",
    };
    message = await Message.createMessage(
      user.id,
      project.id,
      messageFields
    );

    expect(message).toMatchObject({
      id: expect.any(String),
      creator_id: expect.stringMatching(user.id),
      created_on: expect.any(Date),
      text: expect.stringMatching(messageFields.text),
      project_id: expect.stringMatching(project.id)
    });
  });

  it('should retrieve message by ID', async () => {
    const retrievedMessage = await Message.getMessageById(message.id);

    expect(retrievedMessage).toMatchObject({
      ...message,
      posted_by: expect.objectContaining({
        ...user,
        created_on: expect.any(String),
      }),
    });
  });

  it('should retrieve messages by project ID', async () => {
    const deletedMessages = await Message.getMessagesByProjectId(project.id);

    expect(deletedMessages).toMatchObject({
      totalCount: expect.any(Number),
      messages: expect.any(Array),
      offset: expect.any(Number),
    });
    expect(deletedMessages.messages).toHaveLength(1);
    expect(deletedMessages.messages[0]).toMatchObject({
      ...message,
      posted_by: expect.objectContaining({
        ...user,
        created_on: expect.any(String),
      }),
    });
  });

  it('should delete message by ID', async () => {
    const deletedMessage = await Message.deleteMessageById(message.id, user.id);

    expect(deletedMessage).toMatchObject(message);
  });

  it('should delete messages by project ID', async () => {
    const messageQuery = addItemIntoDb('messages', {
      creatorId: user.id,
      projectId: project.id,
      text: "Another test message"
    });
    // add user as project's member to set admin status to true
    const memberQuery = addItemIntoDb('project_members', {
      projectId: project.id,
      userId: user.id,
      position: "Director",
      isAdmin: true
    });
    const [newMessage, ] = await Promise.all([
      messageQuery,
      memberQuery,
    ]);

    const deletedMessages = await Message.deleteMessagesByProjectId(project.id, user.id);

    expect(deletedMessages).toBeInstanceOf(Array);
    expect(deletedMessages).toHaveLength(1);
    expect(deletedMessages[0]).toEqual(newMessage);
  });
});
