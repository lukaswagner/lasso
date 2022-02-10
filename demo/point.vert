layout(location = 0) in vec3 a_position;

uniform mat4 u_viewProjection;

void main()
{
    gl_Position = u_viewProjection * vec4(a_position, 1.0);
    gl_PointSize = 5.0;
}
