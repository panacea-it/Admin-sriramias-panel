/**
 * @deprecated Use facultyService — kept for backward compatibility.
 */
import { facultyService } from './facultyService'

export const getTeachers = facultyService.getFacultyList
export const getTeacherById = facultyService.getFacultyById
export const createTeacher = facultyService.createFaculty
export const updateTeacher = facultyService.updateFaculty
export const updateTeacherStatus = facultyService.updateFacultyStatus
export const deleteTeacher = facultyService.deleteFaculty

export default facultyService
