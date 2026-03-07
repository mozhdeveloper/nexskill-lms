import React from "react";

interface CourseDetailContentProps {
  description: string;
  whatYouLearn?: string[];
  tools?: string[];
  isEnrolled: boolean;
}

const CourseDetailContent: React.FC<CourseDetailContentProps> = ({
  description,
  whatYouLearn,
  tools,
  isEnrolled,
}) => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">
          About this course
        </h3>
        <p className="text-text-secondary dark:text-dark-text-secondary leading-relaxed">
          {description}
        </p>
      </div>

      {whatYouLearn && whatYouLearn.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">
            What you'll learn
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {whatYouLearn.map((item: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tools && tools.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">
            Tools & Technologies
          </h3>
          <div className="flex flex-wrap gap-2">
            {tools.map((tool: string) => (
              <span
                key={tool}
                className="px-4 py-2 bg-[#F5F7FF] dark:bg-gray-800 text-brand-primary rounded-full text-sm font-medium"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Information about hidden features */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-gray-700">
        <h4 className="font-semibold text-text-primary dark:text-dark-text-primary mb-2 flex items-center gap-2">
          <span>🚧</span>
          <span>Course Content Under Development</span>
        </h4>
        <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-3">
          Lessons, quizzes, and detailed curriculum are currently being prepared
          by the instructor.
        </p>
        {isEnrolled && (
          <p className="text-sm text-brand-primary font-medium">
            💬 Meanwhile, join the Course Circle to connect with other enrolled
            students and the instructor!
          </p>
        )}
      </div>
    </div>
  );
};

export default CourseDetailContent;
