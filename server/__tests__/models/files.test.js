import * as File from "../../models/File";
import { addItemIntoDb, addProject, addUser } from "../utils/helpers";
import { newTestUserInfo, projectInfo } from "../utils/testData";

describe('File Model', () => {
  let user, project, file;

  beforeAll(async () => {
    // create new user in DB
    user = await addUser({
      username: newTestUserInfo.username,
      firstName: newTestUserInfo.firstName,
      lastName: newTestUserInfo.lastName,
      password: newTestUserInfo.password,
    });
    // add new project in DB
    project = await addProject({
      name: projectInfo.name,
      creatorId: user.id,
    });
  });

  it('should create a new file', async () => {
    const fileFields = {
      name: "Some file name",
      url: "https://www.google.com"
    };
    file = await File.createFile(
      user.id,
      project.id,
      fileFields
    );

    expect(file).toMatchObject({
      id: expect.any(String),
      creator_id: expect.stringMatching(user.id),
      created_on: expect.any(Date),
      name: expect.stringMatching(fileFields.name),
      url: expect.stringMatching(fileFields.url),
      project_id: expect.stringMatching(project.id)
    });
  });

  it('should update an existing file', async () => {
    const fileFields = {
      name: "Updated name",
    };
    const updatedFile = await File.updateFile(
      file.id,
      user.id,
      fileFields
    );

    expect(updatedFile).toMatchObject({
      id: expect.any(String),
      creator_id: expect.stringMatching(user.id),
      created_on: expect.any(Date),
      name: expect.stringMatching(fileFields.name),
      url: expect.stringMatching(file.url),
      project_id: expect.stringMatching(project.id)
    });

    file = updatedFile;
  });

  it('should retrieve file by ID', async () => {
    const retrievedfile = await File.getFileById(file.id);

    expect(retrievedfile).toEqual(file);
  });

  it('should retrieve files by project ID', async () => {
    const deletedfiles = await File.getFilesByProjectId(project.id);

    expect(deletedfiles).toBeInstanceOf(Array);
    expect(deletedfiles).toHaveLength(1);
    expect(deletedfiles[0]).toEqual(file);
  });

  it('should delete file by ID', async () => {
    const deletedfile = await File.deleteFileById(file.id, user.id);

    expect(deletedfile).toEqual(file);
  });

  it('should delete files by project ID', async () => {
    const fileQuery = addItemIntoDb('files', {
      creatorId: user.id,
      projectId: project.id,
      name: "Another file",
      url: "https://www.google.com"
    });
    // add user as project's member to set admin status to true
    const memberQuery = addItemIntoDb('project_members', {
      projectId: project.id,
      userId: user.id,
      position: "Director",
      isAdmin: true
    });
    const [newfile, ] = await Promise.all([
      fileQuery,
      memberQuery,
    ]);

    const deletedfiles = await File.deleteFilesByProjectId(project.id, user.id);

    expect(deletedfiles).toBeInstanceOf(Array);
    expect(deletedfiles).toHaveLength(1);
    expect(deletedfiles[0]).toEqual(newfile);
  });
});
