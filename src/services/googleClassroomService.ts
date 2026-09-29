export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  ownerId?: string;
  enrollmentCode?: string;
  courseState?: string;
  alternateLink?: string;
}

export interface CourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  state?: string;
  alternateLink?: string;
  creationTime?: string;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
  maxPoints?: number;
  workType?: string;
}

export interface Announcement {
  id: string;
  courseId: string;
  text: string;
  state?: string;
  alternateLink?: string;
  creationTime?: string;
}

/**
 * List active courses for the authenticated user
 */
export async function listClassroomCourses(
  accessToken: string
): Promise<{ courses: ClassroomCourse[] }> {
  const params = new URLSearchParams({
    courseStates: 'ACTIVE',
    pageSize: '30',
  });

  const res = await fetch(`https://classroom.googleapis.com/v1/courses?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to fetch Google Classroom courses (${res.status})`
    );
  }

  const data = await res.json();
  return { courses: data.courses || [] };
}

/**
 * List course work (assignments, questions) for a specific course
 */
export async function listCourseWork(
  accessToken: string,
  courseId: string
): Promise<{ courseWork: CourseWork[] }> {
  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork?pageSize=20`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to fetch coursework for course ${courseId} (${res.status})`
    );
  }

  const data = await res.json();
  return { courseWork: data.courseWork || [] };
}

/**
 * List announcements for a specific course
 */
export async function listAnnouncements(
  accessToken: string,
  courseId: string
): Promise<{ announcements: Announcement[] }> {
  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/announcements?pageSize=20`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to fetch announcements for course ${courseId} (${res.status})`
    );
  }

  const data = await res.json();
  return { announcements: data.announcements || [] };
}
