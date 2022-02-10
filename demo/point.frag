precision highp float;

layout(location = 0) out vec4 f_color;

void main()
{
    if(length(gl_PointCoord * 2.0 - 1.0) > 1.0) discard;
    f_color = vec4(0, 0, 0, 1);
}
