import * as Project from '../models/Project';

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.getProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving projects' });
  }
};

export const getProjectById = async (req, res) => {
  const projectId = req.params.id;
  try {
    const project = await Project.getProjectById(projectId);
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving project' });
  }
};

export const createProject = async (req, res) => {
  const { name } = req.body;
  try {
    const createdProject = await Project.createProject(name);
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project' });
  }
};

export const updateProject = async (req, res) => {
  const projectId = req.params.id;
  const { name } = req.body;
  try {
    const updatedProject = await Project.updateProject(projectId, name);
    if (updatedProject) {
      res.json(updatedProject);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating project' });
  }
};

export const deleteProject = async (req, res) => {
  const projectId = req.params.id;
  try {
    const deletedProject = await Project.deleteProject(projectId);
    if (deletedProject) {
      res.json(deletedProject);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project' });
  }
};
