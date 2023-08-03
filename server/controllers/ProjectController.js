import * as Project from '../models/Project';
import Joi from "joi";
import { default as redis } from "../redis";
import { baseSchema as projectBaseSchema, updatedSchema } from "../validation/schemas/Project";
import { baseSchema as memberBaseSchema } from "../validation/schemas/Member";
import { DEFAULT_PAGE_NUMBER } from "../utils/helpers";

export const getProjects = async (req, res) => {
  const { error, value } = projectBaseSchema
    .append({
      page: Joi.number().optional(),
    })
    .fork(["creatorId", "name"], (schema) => schema.optional())
    .validate({ ...req.body, ...req.query }, { allowUnknown: true });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { page, name } = value;

  if (name && !name.match(/^[A-Za-z ]+$/)) {
    return res.status(400).json({ message: "Special characters or numbers are not allowed" });
  }

  const pageNumber = page || DEFAULT_PAGE_NUMBER;
  const userId = req.userId;
  const redisKey = "projects";
  const redisSubKey = `page:${pageNumber}:search:${name}`;

  try {
    const storedResults = await redis.get(redisKey);
    let storedResultsAsJson = {};
    if (storedResults) {
      storedResultsAsJson = JSON.parse(storedResults);
      const storedProjectsObj = storedResultsAsJson[redisSubKey];
      if (storedProjectsObj) {
        return res.json(storedProjectsObj);
      }
    }
    const projectsObj = await Project.getProjects(
      userId,
      { name },
      pageNumber
    );

    // save copy of search results in redis
    await redis.set(
      redisKey,
      JSON.stringify({
        ...storedResultsAsJson,
        [redisSubKey]: projectsObj
      },
      "EX",
      5 * 60 // key expiration set to 5 minutes
    ));

    res.json(projectsObj);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error retrieving projects' });
  }
};

export const getProjectById = async (req, res) => {
  const { error, value } = updatedSchema.validate({
    ...req.params
  });

  if (error) {
    const { message } = error.details[0];
    if (message.includes("must be a valid GUID")) {
      return res.status(404).json({ message: "Project not found" });
    } else {
      return res.status(400).json({ message });
    }
  }
  const { id: projectId } = value;
  const userId = req.userId;

  try {
    const project = await Project.getProjectById(projectId, userId);
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error retrieving project' });
  }
};

export const createProject = async (req, res) => {
  const { error: projectError, value: projectValue } = projectBaseSchema
    .fork(["creatorId"], (schema) => schema.optional())
    .validate({ ...req.body }, { allowUnknown: true });

  const { error: memberError, value: memberValue } = memberBaseSchema
    .fork(["projectId", "userId", "isAdmin"], (schema) => schema.optional())
    .validate({ ...req.body }, { allowUnknown: true });

  if (projectError) {
    return res.status(400).json({ message: projectError.details[0].message });
  }

  if (memberError) {
    return res.status(400).json({ message: memberError.details[0].message });
  }

  const {
    name,
    position
  } = { ...projectValue, ...memberValue };
  const userId = req.userId;

  try {
    const createdProject = await Project.createProject(
      userId,
      { name },
      { position }
    );

    // remove all project search results stored in redis
    await redis.del("projects");

    res.status(201).json(createdProject);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating project' });
  }
};

export const updateProject = async (req, res) => {
  const { error, value } = updatedSchema
    .fork(["name"], (schema) => schema.required())
    .validate(
      { ...req.body, ...req.params },
      { allowUnknown: true }
    );

  if (error) {
    const { message } = error.details[0];
    if (message.includes("must be a valid GUID")) {
      return res.status(404).json({ message: "Project not found" });
    } else {
      return res.status(400).json({ message });
    }
  }

  const {
    id: projectId,
    name
  } = value;
  const userId = req.userId;
  try {
    const updatedProject = await Project.updateProject(
      projectId,
      userId,
      { name }
    );

    // remove all project search results stored in redis
    await redis.del("projects");

    res.json(updatedProject);
  } catch (error) {
    let errorStatus;
    switch(error.message.toLowerCase()) {
      case "access denied":
        errorStatus = 401;
        break;
      case "project not found":
        errorStatus = 404;
        break;
      default:
        errorStatus = 500;
    }
    res.status(errorStatus).json({ message: error.message || 'Error updating project' });
  }
};

export const deleteProject = async (req, res) => {
  const { error, value } = updatedSchema.validate(
    { ...req.params },
    { allowUnknown: true }
  );

  if (error) {
    if (message.includes("must be a valid GUID")) {
      return res.status(404).json({ message: "Project not found" });
    } else {
      return res.status(400).json({ message });
    }
  }

  const { id: projectId } = value;
  const userId = req.userId;
  try {
    await Project.deleteProject(projectId, userId);

    // remove all project search results stored in redis
    await redis.del("projects");

    res.sendStatus(200);
  } catch (error) {
    let errorStatus;
    switch(error.message.toLowerCase()) {
      case "access denied":
        errorStatus = 401;
        break;
      case "project not found":
        errorStatus = 404;
        break;
      default:
        errorStatus = 500;
    }
    res.status(errorStatus).json({ message: error.message || 'Error deleting project' });
  }
};
